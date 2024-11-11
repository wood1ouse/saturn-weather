import { Kafka, logLevel } from "kafkajs";
import { randomUUID } from "crypto";
import { OpenMeteoService } from "./services/OpenMeteoService.";

const OPEN_METEO_DATA = "openmeteo-data";
const KAFKA_BROKER_ADDRESS = process.env.KAFKA_BROKER!;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

const kafka = new Kafka({
	clientId: "weather-producer",
	brokers: [KAFKA_BROKER_ADDRESS],
	logLevel: logLevel.ERROR,
});
const producer = kafka.producer();

async function retry<T>(fn: () => Promise<T>, maxRetries: number): Promise<T> {
	let retries = 0;
	while (true) {
		try {
			return await fn();
		} catch (error) {
			retries++;
			if (retries >= maxRetries) throw error;
			console.log(`Retrying... (${retries}/${maxRetries})`);
			await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
		}
	}
}

async function produce() {
	await producer.connect();

	const sendWeatherData = async () => {
		try {
			const response = await retry(
				() => OpenMeteoService.getWeatherData(),
				MAX_RETRIES,
			);
			await producer.send({
				topic: OPEN_METEO_DATA,
				messages: [
					{
						key: randomUUID(),
						value: Buffer.from(JSON.stringify(response)),
					},
				],
			});
			console.log("Message sent successfully to Kafka");
		} catch (error) {
			console.error("Failed to retrieve states or send message:", error);
		}
	};

	await sendWeatherData();

	setInterval(sendWeatherData, 60 * 60 * 1000);

	console.log("Weather Producer Started Successfully");
}

produce();
