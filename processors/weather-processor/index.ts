import { Kafka, logLevel } from "kafkajs";
import { DebeziumResponse, RawResponse, Response } from "./models/api";
import axios from "axios";
import WebSocket, { WebSocketServer } from "ws";
import { HeatmapProcessorService } from "./services/HeatmapProcessorService";
import { HeatmapPoint } from "interpolateheatmaplayer";

const HISTORICAL_CONSUMER = "historical-consumer";
const CDC_SCHEMA = "weather.public.weather_historical";
const KAFKA_BROKER_ADDRESS = process.env.KAFKA_BROKER!;

const connectorConfig = {
	name: "weather-connector",
	config: {
		"connector.class": "io.debezium.connector.postgresql.PostgresConnector",
		"plugin.name": "pgoutput",
		"database.hostname": "cdm-spatial-historical-database",
		"database.port": "5433",
		"database.user": "postgres",
		"database.password": "zzz999zzz",
		"database.dbname": "postgres",
		"database.server.name": "postgres",
		"table.include.list": "public.weather_historical",
		"topic.prefix": "weather",
		"producer.max.request.size": "2097152",
		"producer.buffer.memory": "33554432",
	},
};

async function createConnector() {
	let retries = 100;
	while (retries > 0) {
		try {
			const response = await axios.post(
				"http://cdm-spatial-historical-database-connect:8084/connectors",
				connectorConfig,
				{
					headers: {
						"Content-Type": "application/json",
					},
				},
			);
			console.log("Connector added successfully:", response.data);
			break;
		} catch (error) {
			retries--;
			console.log(
				`Failed to add connector. Retrying... (${100 - retries}/100)`,
			);
			await new Promise((res) => setTimeout(res, 5000));
		}
	}

	if (retries === 0) {
		console.error("Failed to add connector after 100 retries");
	}
}

const wss = new WebSocketServer({ port: 8081 });
let clients: WebSocket[] = [];
let latestMessage: HeatmapPoint[] | null = null;

async function consume() {
	try {
		const connectors = await axios.get(
			"http://cdm-spatial-historical-database-connect:8084/connectors",
		);
		if (connectors.data.length === 0) {
			await createConnector();
		}
	} catch (error) {
		await createConnector();
	}

	const kafka = new Kafka({
		clientId: "weather-processor",
		brokers: [KAFKA_BROKER_ADDRESS],
		logLevel: logLevel.INFO,
	});

	const historicalConsumer = kafka.consumer({
		groupId: HISTORICAL_CONSUMER,
	});

	await historicalConsumer.connect();
	await historicalConsumer.subscribe({
		topic: CDC_SCHEMA,
		fromBeginning: true,
	});

	wss.on("connection", (ws: WebSocket) => {
		console.log("Client connected");

		if (latestMessage) {
			ws.send(JSON.stringify(latestMessage));
		}

		clients.push(ws);

		ws.on("close", () => {
			console.log("Client disconnected");
		});
	});

	console.log("Creating Websocket Connection...");

	function broadcastMessage(message: HeatmapPoint[]) {
		latestMessage = message;
		clients.forEach((client) => {
			client.send(JSON.stringify(message));
		});
	}

	await historicalConsumer.run({
		eachMessage: async ({ message }) => {
			console.log(message);
			try {
				console.log("PROCESSOR: Recieving message from kafka");
				if (!message.value) {
					console.warn("Warning: Empty message value received.");
					return;
				}

				const response: DebeziumResponse<RawResponse> = JSON.parse(
					message.value.toString(),
				);

				if (response.payload && response.payload.after) {
					const heatMapValues = HeatmapProcessorService.parseByProperty(
						response.payload.after,
						"precipitation",
					);
					console.log("PROCESSOR: Broadcasting values:", heatMapValues);
					broadcastMessage(heatMapValues);
				} else {
					console.warn("Warning: Empty payload data in message.");
				}
			} catch (error) {
				console.error("Error processing message:", error);
			}
		},
	});

	console.log("Weather Processor Started Successfully");
}

consume();
