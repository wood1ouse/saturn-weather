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

export const openMeteoEndpoints = {
	weather: {
		historical: (lats: string, longs: string, date: string) => {
			return `https://api.open-meteo.com/v1/forecast?${lats}&${longs}&start_date=${date}&end_date=${date}&hourly=precipitation`;
		},
	},
};
