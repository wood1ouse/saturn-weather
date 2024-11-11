import axios from "axios";
import { openMeteoEndpoints, Response } from "../models/api";

export class OpenMeteoService {
	static async getWeatherData(): Promise<Response[]> {
		const startingLatitude = -80;
		const startingLongitude = -180;
		const endingLatitude = 80;
		const endingLongitude = 180;
		const n = 10;

		const gridPoints = [];
		for (let i = 0; i < n; i++) {
			for (let j = 0; j < n; j++) {
				gridPoints.push({
					lat: startingLatitude + (i * (endingLatitude - startingLatitude)) / n,
					lng:
						startingLongitude + (j * (endingLongitude - startingLongitude)) / n,
					val: 0,
				});
			}
		}

		const lats = `latitude=${gridPoints.map((point) => point.lat).join(",")}`;
		const longs = `longitude=${gridPoints.map((point) => point.lng).join(",")}`;

		const date = new Date(Date.now()).toISOString().split("T")[0];

		const response = await axios.get<Response[]>(
			openMeteoEndpoints.weather.historical(lats, longs, date),
		);

		return response.data;
	}
}
