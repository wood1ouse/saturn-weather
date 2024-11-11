import { feature, featureCollection } from "@turf/helpers";
import { FeatureCollection, Point } from "geojson";

import { Response, WeatherStateProperties } from "../models/api";

export class GeoJSONService {
	static toWeatherStateFeatureCollection(
		response: Response[],
	): FeatureCollection<Point, WeatherStateProperties> {
		const features = response.map((state) => {
			const now = new Date();
			now.setMinutes(0, 0, 0);
			const formattedNow = now.toISOString().slice(0, 13) + ":00";

			const index = state.hourly.time.indexOf(formattedNow);

			return feature(
				{
					type: "Point",
					coordinates: [state.longitude, state.latitude],
				},
				{
					generationtime_ms: state.generationtime_ms,
					utc_offset_seconds: state.utc_offset_seconds,
					timezone: state.timezone,
					timezone_abbreviation: state.timezone_abbreviation,
					elevation: state.elevation,
					hourly_units: state.hourly_units,
					precipitation: state.hourly.precipitation[index],
				},
			);
		});
		return featureCollection<Point, WeatherStateProperties>(features);
	}
}
