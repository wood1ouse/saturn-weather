import { Point, FeatureCollection } from "geojson";

export interface DebeziumResponse<Data extends object> {
	payload: {
		after: Data;
	};
}

interface WeatherStateProperties {
	generationtime_ms: number;
	utc_offset_seconds: number;
	timezone: string;
	timezone_abbreviation: string;
	elevation: number;
	hourly_units: {
		time: string;
		precipitation: string;
	};
	precipitation: number;
}

export interface Response {
	timestamp: number;
	geojson: FeatureCollection<Point, WeatherStateProperties>;
}

export interface RawResponse extends Omit<Response, "geojson"> {
	geojson: string;
}
