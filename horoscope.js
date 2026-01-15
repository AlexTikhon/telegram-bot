import * as cheerio from "cheerio";
import { summarizeHoroscope } from "./ai.js";

const SIGN_SLUGS = {
  "овен": "aries",
  "телец": "taurus",
  "близнецы": "gemini",
  "рак": "cancer",
  "лев": "leo",
  "дева": "virgo",
  "весы": "libra",
  "скорпион": "scorpio",
  "стрелец": "sagittarius",
  "козерог": "capricorn",
  "водолей": "aquarius",
  "рыбы": "pisces",
};

function normalizeSignName(name) {
  return name.toLowerCase().trim();
}

export async function getDailyHoroscopeFromWeb(signNameRaw) {
  const signKey = normalizeSignName(signNameRaw);
  const slug = SIGN_SLUGS[signKey];

  if (!slug) {
    return "Я не узнал такой знак зодиака 🙂\nПопробуй так:\nовен, телец, близнецы, рак, лев, дева, весы, скорпион, стрелец, козерог, водолей, рыбы";
  }

  const url = `https://zody.woman.ru/${slug}/today`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Не удалось получить гороскоп (${res.status})`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  let rawText = "";

  const heading = $("h1, h2")
    .filter((_, el) => $(el).text().includes("Гороскоп на сегодня"))
    .first();

  if (heading.length > 0) {
    rawText = heading
      .nextAll("p")
      .slice(0, 6)
      .text();
  }

  if (!rawText || rawText.trim().length < 50) {
    rawText = $("main").text();
  }

  const cleaned = rawText.replace(/\s+/g, " ").trim();

  if (!cleaned || cleaned.length < 50) {
    throw new Error("Не удалось вытащить текст гороскопа — изменилась верстка?");
  }

  const summary = await summarizeHoroscope(cleaned.slice(0, 4000));

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  return `🔮 Гороскоп для *${signNameRaw}* на *${today}*\n\n${summary}\n\nИсточник: ${url}`;
}
