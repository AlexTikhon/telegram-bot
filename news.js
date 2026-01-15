import { XMLParser } from "fast-xml-parser";

const RSS_URL = "https://nplus1.ru/rss";

function truncate(text, max = 220) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max).trim() + "…" : text;
}

export async function getLatestRussianSpaceNews(limit = 3) {
  const res = await fetch(RSS_URL);
  if (!res.ok) {
    throw new Error("Не удалось получить RSS");
  }

  const xml = await res.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
  });

  const data = parser.parse(xml);

  const items = data.rss?.channel?.item;
  if (!items || !Array.isArray(items)) {
    throw new Error("Не удалось разобрать RSS новости");
  }

  const news = items.slice(0, limit);

  const lines = [];
  lines.push("🛰 *Свежие научные новости (на русском):*");
  lines.push("");

  for (const item of news) {
    const title = item.title || "Без названия";
    const link = item.link || "";
    const description = truncate(item.description || "");
    const date = item.pubDate || "";

    lines.push(
      `*${title}*\n` +
      `${description || "_(описание недоступно)_"}\n` +
      `📅 ${date}\n` +
      (link ? `[Читать подробнее](${link})` : "")
    );
    lines.push("");
  }

  return lines.join("\n");
}
