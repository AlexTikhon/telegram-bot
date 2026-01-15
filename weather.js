const WEATHER_CODE_MAP = {
  0: "☀️ Ясно",
  1: "🌤️ В основном ясно",
  2: "⛅ Переменная облачность",
  3: "☁️ Пасмурно",
  45: "🌫️ Туман",
  48: "🌫️ Туман с изморозью",
  51: "🌦️ Лёгкая морось",
  53: "🌦️ Морось",
  55: "🌧️ Сильная морось",
  61: "🌦️ Лёгкий дождь",
  63: "🌧️ Дождь",
  65: "🌧️ Ливень",
  71: "🌨️ Лёгкий снег",
  73: "🌨️ Снег",
  75: "❄️ Сильный снег",
  80: "🌦️ Кратковременный дождь",
  81: "🌧️ Сильный кратковременный дождь",
  82: "⛈️ Ливень с грозой",
};

function decodeWeatherCode(code) {
  return WEATHER_CODE_MAP[code] || "🌈 Погода переменчивая";
}

export async function getWeather3Days(cityName) {
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    cityName
  )}&count=1&language=ru&format=json`;

  const geoRes = await fetch(geoUrl);
  if (!geoRes.ok) {
    throw new Error("Ошибка геокодинга");
  }

  const geoData = await geoRes.json();

  if (!geoData.results || geoData.results.length === 0) {
    throw new Error("Я не нашёл такой город. Попробуй написать по-другому.");
  }

  const place = geoData.results[0];
  const { latitude, longitude, name, country, timezone } = place;

  const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=${encodeURIComponent(
    timezone
  )}&forecast_days=3`;

  const forecastRes = await fetch(forecastUrl);
  if (!forecastRes.ok) {
    throw new Error("Ошибка получения прогноза погоды");
  }

  const forecastData = await forecastRes.json();
  const daily = forecastData.daily;

  const lines = [];
  lines.push(
    `📍 Погода для *${name}${country ? ", " + country : ""}* на ближайшие 3 дня:`
  );
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

    const emojiText = decodeWeatherCode(code);

    const [y, m, d] = date.split("-");
    const prettyDate = `${d}.${m}`;

    lines.push(
      `*${prettyDate}* — ${emojiText}\n` +
      `Температура: от ${min}°C до ${max}°C\n` +
      `Вероятность осадков: ${rain}%`
    );
    lines.push("");
  }

  return lines.join("\n");
}
