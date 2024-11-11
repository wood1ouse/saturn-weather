import { DiscreteProperties } from "./../../../translators/weather-translator/models/api";
import { HeatmapPoint } from "interpolateheatmaplayer";
import { RawResponse, Response } from "../models/api";

export class HeatmapProcessorService {
	static parseByProperty(
		response: RawResponse,
		property: keyof DiscreteProperties,
	): HeatmapPoint[] {
		const geojson: Response["geojson"] = JSON.parse(response.geojson);
		return geojson.features.map((feature) => ({
			lon: feature.geometry.coordinates[0],
			lat: feature.geometry.coordinates[1],
			val: feature.properties[property],
		}));
	}
}
