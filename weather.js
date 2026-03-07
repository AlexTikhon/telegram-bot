import { fetchWithRetry } from "./http.js";

const WEATHER_CODE_MAP = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Heavy rain showers",
  82: "Thunderstorm showers",
};

function decodeWeatherCode(code) {
  return WEATHER_CODE_MAP[code] || "Changeable weather";
}

export async function getWeather3Days(cityName) {
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    cityName
  )}&count=1&language=en&format=json`;

  const geoRes = await fetchWithRetry(geoUrl, {
    timeoutMs: 7000,
    retries: 2,
  });
  if (!geoRes.ok) {
    throw new Error("Geocoding request failed");
  }

  const geoData = await geoRes.json();

  if (!geoData.results || geoData.results.length === 0) {
    throw new Error("City not found. Try another spelling.");
  }

  const place = geoData.results[0];
  const { latitude, longitude, name, country, timezone } = place;

  const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=${encodeURIComponent(
    timezone
  )}&forecast_days=3`;

  const forecastRes = await fetchWithRetry(forecastUrl, {
    timeoutMs: 7000,
    retries: 2,
  });
  if (!forecastRes.ok) {
    throw new Error("Forecast request failed");
  }

  const forecastData = await forecastRes.json();
  const daily = forecastData.daily;

  const lines = [];
  lines.push(`📍 *${name}${country ? ", " + country : ""}* weather for the next 3 days:`);
  lines.push("");

  const dates = daily.time;
  const tMax = daily.temperature_2m_max;
  const tMin = daily.temperature_2m_min;
  const rainProb = daily.precipitation_probability_max;
  const codes = daily.weathercode;

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const max = Math.round(tMax[i]);
    const min = Math.round(tMin[i]);
    const rain = rainProb[i];
    const code = codes[i];

    const weatherText = decodeWeatherCode(code);

    const [, m, d] = date.split("-");
    const prettyDate = `${d}.${m}`;

    lines.push(
      `*${prettyDate}* - ${weatherText}\n` +
        `Temperature: ${min}°C to ${max}°C\n` +
        `Precipitation chance: ${rain}%`
    );
    lines.push("");
  }

  return lines.join("\n");
}
