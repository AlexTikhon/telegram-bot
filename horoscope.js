import * as cheerio from "cheerio";
import { summarizeHoroscope } from "./ai.js";
import { fetchWithRetry } from "./http.js";

const SIGN_SLUGS = {
  aries: "aries",
  taurus: "taurus",
  gemini: "gemini",
  cancer: "cancer",
  leo: "leo",
  virgo: "virgo",
  libra: "libra",
  scorpio: "scorpio",
  sagittarius: "sagittarius",
  capricorn: "capricorn",
  aquarius: "aquarius",
  pisces: "pisces",
};

function normalizeSignName(name) {
  return name.toLowerCase().trim();
}

function extractText($) {
  let rawText = "";

  const heading = $("h1, h2")
    .filter((_, el) => /today/i.test($(el).text()))
    .first();

  if (heading.length > 0) {
    rawText = heading.nextAll("p").slice(0, 6).text();
  }

  if (!rawText || rawText.trim().length < 50) {
    rawText = $("article, main").first().text();
  }

  return rawText.replace(/\s+/g, " ").trim();
}

export async function getDailyHoroscopeFromWeb(signNameRaw) {
  const signKey = normalizeSignName(signNameRaw);
  const slug = SIGN_SLUGS[signKey];

  if (!slug) {
    return "Unknown zodiac sign 🙂 Try one of: aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn, aquarius, pisces";
  }

  const url = `https://zody.woman.ru/${slug}/today`;

  const res = await fetchWithRetry(url, {
    timeoutMs: 9000,
    retries: 2,
  });
  if (!res.ok) {
    throw new Error(`Could not fetch horoscope (${res.status})`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  const cleaned = extractText($);

  if (!cleaned || cleaned.length < 50) {
    throw new Error("Could not extract horoscope text. Source layout may have changed.");
  }

  const summary = await summarizeHoroscope(cleaned.slice(0, 4000));
  const today = new Date().toISOString().split("T")[0];

  return `🔮 *${signNameRaw}* horoscope for *${today}*\n\n${summary}\n\nSource: ${url}`;
}
