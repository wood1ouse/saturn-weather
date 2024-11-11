import express, { Request, Response } from "express";
import { Client } from "pg";
import cors from "cors";

const app = express();
const port = 3003;

const pgClient = new Client({
	user: process.env.POSTGRES_USER,
	host: process.env.POSTGRES_HOST,
	database: process.env.POSTGRES_DB,
	password: process.env.POSTGRES_PASSWORD,
	port: parseInt(process.env.POSTGRES_PORT || "5432"),
});

pgClient.connect();

pgClient.on("error", (e) => {
	console.log(`Error: ${e}`);
});

app.get("/timestamps", async (req: Request, res: Response) => {
	try {
		const result = await pgClient.query(
			"SELECT timestamp FROM flight_positions;",
		);

		const timestamps = result.rows.map((res: { timestamp: string }) =>
			parseInt(res.timestamp),
		);
		res.header({ "Access-Control-Allow-Origin": "*" });
		res.json(timestamps);
	} catch (error) {
		console.error("Error fetching data:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.get("/locationsByTime", async (req: Request, res: Response) => {
	const { timestamp } = req.query;

	if (!timestamp) {
		return res.status(400).json({ error: "Timestamp is required" });
	}

	try {
		const result = await pgClient.query(
			"SELECT geojson FROM flight_positions WHERE timestamp = $1 LIMIT 1",
			[Number(timestamp)],
		);

		if (result.rows.length === 0) {
			return res.status(404).json({
				error: "FeatureCollection not found for the given timestamp",
			});
		}

		const featureCollection = result.rows[0].geojson;
        res.header({ "Access-Control-Allow-Origin": "*" });
		res.json(featureCollection);
	} catch (error) {
		console.error("Error fetching data:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.use(cors());

app.listen(port, () => {
	console.log(`Weather Historical Server is running`);
});
