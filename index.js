import TelegramBot from "node-telegram-bot-api";
import express from "express";
import "dotenv/config";
import { gameOptions, againOptions } from "./options.js";
import { askAI } from "./ai.js";
import { getWeather3Days } from "./weather.js";
import { getLatestScienceNews } from "./news.js";
import { getDailyHoroscopeFromWeb } from "./horoscope.js";
import { getDailyTarotSpread } from "./tarot.js";
import { TTLCache } from "./cache.js";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN is missing in .env");
}

const isRender = !!process.env.RENDER_EXTERNAL_URL;
const bot = new TelegramBot(token, { polling: !isRender });

if (isRender) {
  const app = express();
  app.use(express.json());

  const externalUrl = process.env.RENDER_EXTERNAL_URL;
  const webhookPath = `/webhook/${token}`;
  const webhookUrl = `${externalUrl}${webhookPath}`;

  console.log("Render external URL:", externalUrl);
  console.log("Webhook URL:", webhookUrl);

  bot
    .setWebHook(webhookUrl)
    .then(() => {
      console.log("Webhook set successfully");
    })
    .catch((err) => {
      console.error("Error setting webhook:", err);
    });

  app.post(webhookPath, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });

  app.get("/", (_, res) => {
    res.send("Bot is running.");
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Express server listening on port ${port}`);
  });
}

bot.setMyCommands([
  { command: "/start", description: "Start the bot" },
  { command: "/tarot", description: "Daily tarot spread (3 cards)" },
  { command: "/horoscope", description: "Daily horoscope from the web" },
  { command: "/weather", description: "3-day weather forecast" },
  { command: "/news", description: "Latest science and space news" },
  { command: "/game", description: "Play guess the number" },
  { command: "/info", description: "Show your profile info" },
]);

const chats = {};
const waitingWeatherCity = {};
const userZodiac = {};
const cache = new TTLCache();

const CACHE_TTL = {
  weather: 15 * 60 * 1000,
  news: 10 * 60 * 1000,
  horoscope: 6 * 60 * 60 * 1000,
};

const zodiacSigns = new Set([
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
]);

function normalizeSign(text) {
  return text.toLowerCase().trim();
}

function isValidSign(text) {
  return zodiacSigns.has(normalizeSign(text));
}

function getTodayStamp() {
  return new Date().toISOString().split("T")[0];
}

async function getCachedWeather(cityName) {
  const key = `weather:${cityName.toLowerCase()}`;
  return cache.getOrSet(key, CACHE_TTL.weather, () => getWeather3Days(cityName));
}

async function getCachedNews(limit) {
  const key = `news:${limit}`;
  return cache.getOrSet(key, CACHE_TTL.news, () => getLatestScienceNews(limit));
}

async function getCachedHoroscope(sign) {
  const key = `horoscope:${sign}:${getTodayStamp()}`;
  return cache.getOrSet(key, CACHE_TTL.horoscope, () => getDailyHoroscopeFromWeb(sign));
}

async function startGame(chatId) {
  const randomNumber = Math.floor(Math.random() * 10);
  chats[chatId] = randomNumber;

  await bot.sendMessage(chatId, "Let's play: guess a number from 0 to 9.");
  return bot.sendMessage(chatId, "Choose a number:", gameOptions);
}

async function handleStart(chatId) {
  await bot.sendSticker(
    chatId,
    "CAACAgIAAxkBAAMTaVF8fmf6BZs2oQi29D5iu3sOW1AAAv8CAAJtsEIDBKA5qzQCNjc2BA"
  );
  return bot.sendMessage(chatId, "Welcome! How can I help you today?");
}

async function handleTarot(chatId) {
  await bot.sendChatAction(chatId, "typing");
  const spreadText = getDailyTarotSpread(chatId);
  return bot.sendMessage(chatId, spreadText, { parse_mode: "Markdown" });
}

async function handleWeatherPrompt(chatId) {
  waitingWeatherCity[chatId] = true;
  return bot.sendMessage(
    chatId,
    "For which city should I show a 3-day forecast?\n\nExample: *Warsaw* or *Barcelona*",
    { parse_mode: "Markdown" }
  );
}

async function handleWeatherCity(chatId, cityName) {
  await bot.sendChatAction(chatId, "typing");
  const weatherText = await getCachedWeather(cityName);
  return bot.sendMessage(chatId, weatherText, { parse_mode: "Markdown" });
}

async function handleNews(chatId) {
  await bot.sendChatAction(chatId, "typing");
  const text = await getCachedNews(3);
  return bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
}

async function handleInfo(chatId, msg) {
  return bot.sendMessage(
    chatId,
    `Your name: ${msg.from.first_name}\n` +
      `Your username: @${msg.from.username || "not set"}`
  );
}

async function handleHoroscope(chatId, receivedText) {
  const parts = receivedText.split(/\s+/);
  const maybeSign = parts[1];

  if (maybeSign) {
    if (!isValidSign(maybeSign)) {
      return bot.sendMessage(
        chatId,
        "Unknown zodiac sign 🙂\nTry one of these:\naries, taurus, gemini, cancer, leo, virgo,\nlibra, scorpio, sagittarius, capricorn, aquarius, pisces"
      );
    }

    const normalized = normalizeSign(maybeSign);
    userZodiac[chatId] = normalized;

    await bot.sendChatAction(chatId, "typing");
    const text = await getCachedHoroscope(normalized);
    return bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
  }

  const savedSign = userZodiac[chatId];
  if (!savedSign) {
    return bot.sendMessage(
      chatId,
      "I do not know your zodiac sign yet 🙂\n\nSend one of these:\n/horoscope leo\n/horoscope pisces\n\nAfter that, you can use /horoscope without a sign."
    );
  }

  await bot.sendChatAction(chatId, "typing");
  const text = await getCachedHoroscope(savedSign);
  return bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
}

async function handleAIFallback(chatId, msg, receivedText) {
  await bot.sendChatAction(chatId, "typing");
  const userName = msg.from?.first_name || msg.from?.username || "friend";
  const aiReply = await askAI(receivedText, userName);
  return bot.sendMessage(chatId, aiReply);
}

const commandHandlers = {
  "/start": async (chatId) => handleStart(chatId),
  "/tarot": async (chatId) => handleTarot(chatId),
  "/weather": async (chatId) => handleWeatherPrompt(chatId),
  "/news": async (chatId) => handleNews(chatId),
  "/game": async (chatId) => startGame(chatId),
  "/again": async (chatId) => startGame(chatId),
  "/info": async (chatId, msg) => handleInfo(chatId, msg),
};

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const receivedText = msg.text;

  if (!receivedText) return;

  if (waitingWeatherCity[chatId] && !receivedText.startsWith("/")) {
    const cityName = receivedText.trim();
    waitingWeatherCity[chatId] = false;

    try {
      return await handleWeatherCity(chatId, cityName);
    } catch (err) {
      console.error("Weather error:", err);
      return bot.sendMessage(
        chatId,
        "Could not get the weather 😔 Try another city format, for example: *Warsaw* or *Barcelona*.",
        { parse_mode: "Markdown" }
      );
    }
  }

  if (receivedText.startsWith("/horoscope")) {
    try {
      return await handleHoroscope(chatId, receivedText);
    } catch (err) {
      console.error("Horoscope error:", err);
      return bot.sendMessage(
        chatId,
        "Could not fetch horoscope 😔 The source website may be temporarily unavailable or changed."
      );
    }
  }

  const command = receivedText.split(/\s+/)[0];
  const handler = commandHandlers[command];
  if (handler) {
    try {
      return await handler(chatId, msg, receivedText);
    } catch (err) {
      console.error(`Command error (${command}):`, err);
      return bot.sendMessage(chatId, "Something went wrong. Please try again later.");
    }
  }

  try {
    return await handleAIFallback(chatId, msg, receivedText);
  } catch (err) {
    console.error("AI error:", err);
    return bot.sendMessage(chatId, "Something went wrong with AI. Please try again a bit later 🙈");
  }
});

bot.on("callback_query", async (callbackQuery) => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;
  const data = callbackQuery.data;

  if (data === "again") {
    await bot.answerCallbackQuery(callbackQuery.id);
    return startGame(chatId);
  }

  const userGuess = Number(data);
  const correctNumber = chats[chatId];

  if (correctNumber === undefined) {
    await bot.answerCallbackQuery(callbackQuery.id);
    return bot.sendMessage(chatId, "No active round yet. Send /game to start a new one 🙂");
  }

  const text =
    userGuess === correctNumber
      ? `🎉 Nice! You guessed the correct number: ${correctNumber}`
      : `😔 Not this time. The correct number was ${correctNumber}. Try again!`;

  delete chats[chatId];

  await bot.answerCallbackQuery(callbackQuery.id);
  await bot.sendMessage(chatId, text, againOptions);
});

console.log("Bot is running...");
