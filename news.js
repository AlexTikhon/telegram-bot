import { XMLParser } from "fast-xml-parser";
import { fetchWithRetry } from "./http.js";

const RSS_URL = "https://nplus1.ru/rss";

function truncate(text, max = 220) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max).trim() + "..." : text;
}

export async function getLatestScienceNews(limit = 3) {
  const res = await fetchWithRetry(RSS_URL, {
    timeoutMs: 7000,
    retries: 2,
  });
  if (!res.ok) {
    throw new Error("Failed to fetch RSS feed");
  }

  const xml = await res.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
  });

  const data = parser.parse(xml);

  const items = data.rss?.channel?.item;
  if (!items || !Array.isArray(items)) {
    throw new Error("Failed to parse RSS news");
  }

  const news = items.slice(0, limit);

  const lines = [];
  lines.push("🛰 *Latest science news:*");
  lines.push("");

  for (const item of news) {
    const title = item.title || "Untitled";
    const link = item.link || "";
    const description = truncate(item.description || "");
    const date = item.pubDate || "";

    lines.push(
      `*${title}*\n` +
        `${description || "_(description unavailable)_"}\n` +
        `📅 ${date}\n` +
        (link ? `[Read more](${link})` : "")
    );
    lines.push("");
  }

  return lines.join("\n");
}
