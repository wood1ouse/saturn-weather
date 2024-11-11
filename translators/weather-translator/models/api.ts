export interface Response {
	latitude: number;
	longitude: number;
	generationtime_ms: number;
	utc_offset_seconds: number;
	timezone: string;
	timezone_abbreviation: string;
	elevation: number;
	hourly_units: {
		time: string;
		precipitation: string;
	};
	hourly: {
		time: string[];
		precipitation: number[];
	};
}

export interface WeatherStateProperties
	extends Pick<
		Response,
		| "generationtime_ms"
		| "utc_offset_seconds"
		| "timezone"
		| "timezone_abbreviation"
		| "elevation"
		| "hourly_units"
	> {
	precipitation: number;
}

export interface DiscreteProperties
	extends Pick<WeatherStateProperties, "precipitation"> {}
