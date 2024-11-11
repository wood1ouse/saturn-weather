CREATE TABLE IF NOT EXISTS weather_historical (
    id SERIAL PRIMARY KEY,
    timestamp BIGINT NOT NULL,
    geojson JSONB NOT NULL
);