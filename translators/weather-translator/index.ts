import { Kafka, KafkaMessage, logLevel } from "kafkajs";
import { Response } from "./models/api";
import { GeoJSONService } from "./services/GeoJSONService";
import { Client } from "pg";

const OPEN_METEO_DATA = "openmeteo-data";
const WEATHER_CONSUMER = "weather-consumer";
const KAFKA_BROKER_ADDRESS = process.env.KAFKA_BROKER!;

const pgClient = new Client({
	user: process.env.POSTGRES_USER || "postgres",
	host: process.env.POSTGRES_HOST || "cdm-spatial-historical-database",
	database: process.env.POSTGRES_DB || "postgres",
	password: process.env.POSTGRES_PASSWORD || "zzz999zzz",
	port: parseInt(process.env.POSTGRES_PORT || "5433", 10),
});

pgClient.connect();

const kafka = new Kafka({
	clientId: "translator",
	brokers: [KAFKA_BROKER_ADDRESS],
	logLevel: logLevel.ERROR,
});

const weatherConsumer = kafka.consumer({ groupId: WEATHER_CONSUMER });

async function translate(message: KafkaMessage) {
	const response: Response[] = JSON.parse(message.value?.toString() || "");
	const geojson = GeoJSONService.toWeatherStateFeatureCollection(response);

	const query = `
        INSERT INTO weather_historical (timestamp, geojson)
        VALUES ($1, $2)
        RETURNING id;
    `;
	const values = [new Date().valueOf(), JSON.stringify(geojson)];

	try {
		await pgClient.query(query, values);
		console.log(`TRANSLATOR: Adding Message To Database`);
	} catch (err) {
		console.error("Error inserting into Postgres:", err);
	}
}

async function consumeAndTranslate() {
	await weatherConsumer.subscribe({
		topic: OPEN_METEO_DATA,
		fromBeginning: true,
	});

	await weatherConsumer.connect();

	await weatherConsumer.run({
		eachMessage: async ({ message }) => {
			await translate(message);
		},
	});

	console.log("Flights Translator Started Successfully");
}

consumeAndTranslate();
