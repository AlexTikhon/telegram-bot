import TelegramBot from "node-telegram-bot-api";
import express from "express";
import "dotenv/config";
import { gameOptions, createAgainOptions } from "./bot/options.js";
import { askAI, translateText } from "./services/ai.js";
import { getWeather3Days } from "./services/weather.js";
import { getLatestScienceNews } from "./services/news.js";
import { getDailyHoroscopeFromWeb } from "./services/horoscope.js";
import { getDailyTarotSpread, getDailyTarotHint } from "./services/tarot.js";
import { TTLCache } from "./core/cache.js";
import { transcribeAudioBuffer } from "./services/speechToText.js";

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
  { command: "/language", description: "Change chat language" },
  { command: "/digest", description: "Daily digest in one message" },
  { command: "/tarot", description: "Daily tarot spread (3 cards)" },
  { command: "/horoscope", description: "Daily horoscope from the web" },
  { command: "/weather", description: "3-day weather forecast" },
  { command: "/news", description: "Latest science and space news" },
  { command: "/game", description: "Play guess the number" },
  { command: "/info", description: "Show your profile info" },
]);

const chats = {};
const waitingWeatherCity = {};
const waitingHoroscopeSign = {};
const waitingDigestCity = {};
const userCity = {};
const userZodiac = {};
const userLanguage = {};
const cache = new TTLCache();

const CACHE_TTL = {
  weather: 15 * 60 * 1000,
  news: 10 * 60 * 1000,
  horoscope: 6 * 60 * 60 * 1000,
  translation: 24 * 60 * 60 * 1000,
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

const LANGUAGES = {
  en: "English",
  ru: "Russian",
  pl: "Polish",
  es: "Spanish",
  de: "German",
};

function normalizeSign(text) {
  return text.toLowerCase().trim();
}

function isValidSign(text) {
  return zodiacSigns.has(normalizeSign(text));
}

function getTodayStamp() {
  return new Date().toISOString().split("T")[0];
}

function hasLanguage(chatId) {
  return !!userLanguage[chatId];
}

function getLanguageCode(chatId) {
  return userLanguage[chatId] || "en";
}

function getLanguageName(chatId) {
  return LANGUAGES[getLanguageCode(chatId)] || "English";
}

function getLanguageKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "English", callback_data: "lang:en" },
          { text: "Russian", callback_data: "lang:ru" },
        ],
        [
          { text: "Polish", callback_data: "lang:pl" },
          { text: "Spanish", callback_data: "lang:es" },
        ],
        [{ text: "German", callback_data: "lang:de" }],
      ],
    },
  };
}

function normalizeDetectedLanguageCode(rawLanguage) {
  const raw = (rawLanguage || "").toLowerCase().trim();
  if (!raw) return null;

  const aliasToCode = {
    en: "en",
    english: "en",
    ru: "ru",
    russian: "ru",
    pl: "pl",
    polish: "pl",
    es: "es",
    spanish: "es",
    de: "de",
    german: "de",
  };

  return aliasToCode[raw] || null;
}

async function localizeText(chatId, text) {
  const code = getLanguageCode(chatId);
  if (code === "en") return text;

  const key = `tr:${code}:${text}`;
  return cache.getOrSet(key, CACHE_TTL.translation, () =>
    translateText(text, getLanguageName(chatId))
  );
}

async function sendLocalizedMessage(chatId, text, options = {}) {
  if (!hasLanguage(chatId)) {
    return bot.sendMessage(chatId, text, options);
  }

  try {
    const localized = await localizeText(chatId, text);
    return bot.sendMessage(chatId, localized, options);
  } catch (err) {
    console.error("Translation error:", err);
    return bot.sendMessage(chatId, text, options);
  }
}

async function promptLanguageSelection(chatId) {
  return bot.sendMessage(chatId, "Choose your chat language:", getLanguageKeyboard());
}

async function sendAvailableOptions(chatId) {
  const text =
    "*Available options:*\n\n" +
    "`/digest` - weather + 3 news + short insight\n" +
    "`/weather` - 3-day weather forecast\n" +
    "`/news` - latest science and space news\n" +
    "`/horoscope` - daily horoscope\n" +
    "`/tarot` - daily tarot spread\n" +
    "`/game` - guess the number\n" +
    "`/info` - your profile info\n" +
    "`/language` - change language";

  return sendLocalizedMessage(chatId, text, { parse_mode: "Markdown" });
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

function trimToLength(text, maxLen) {
  const normalized = (text || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLen) return normalized;
  return `${normalized.slice(0, maxLen - 3).trim()}...`;
}

function extractHoroscopeSummary(horoscopeText) {
  const match = horoscopeText.match(/\n\n([\s\S]+?)\n\nSource:/);
  const summary = match ? match[1] : horoscopeText;
  return trimToLength(summary, 320);
}

async function buildDailyDigest(chatId, cityName) {
  const [weatherText, newsText] = await Promise.all([
    getCachedWeather(cityName),
    getCachedNews(3),
  ]);

  let insightText;
  const savedSign = userZodiac[chatId];
  if (savedSign) {
    const horoscopeText = await getCachedHoroscope(savedSign);
    insightText = `🔮 *Horoscope (${savedSign})*\n${extractHoroscopeSummary(horoscopeText)}`;
  } else {
    insightText = `${getDailyTarotHint(chatId)}\n\nTip: set your sign with \`/horoscope\` to include horoscope here.`;
  }

  return (
    `🧾 *Daily Digest* (${getTodayStamp()})\n\n` +
    `${weatherText}\n\n` +
    `${newsText}\n\n` +
    `${insightText}`
  );
}

async function startGame(chatId) {
  const randomNumber = Math.floor(Math.random() * 10);
  chats[chatId] = randomNumber;

  await sendLocalizedMessage(chatId, "Let's play: guess a number from 0 to 9.");
  return sendLocalizedMessage(chatId, "Choose a number:", gameOptions);
}

async function handleStart(chatId) {
  await bot.sendSticker(
    chatId,
    "CAACAgIAAxkBAAMTaVF8fmf6BZs2oQi29D5iu3sOW1AAAv8CAAJtsEIDBKA5qzQCNjc2BA"
  );

  if (!hasLanguage(chatId)) {
    return promptLanguageSelection(chatId);
  }

  await sendLocalizedMessage(chatId, "Welcome back!");
  return sendAvailableOptions(chatId);
}

async function handleTarot(chatId) {
  await bot.sendChatAction(chatId, "typing");
  const spreadText = getDailyTarotSpread(chatId);
  return sendLocalizedMessage(chatId, spreadText, { parse_mode: "Markdown" });
}

async function handleWeatherPrompt(chatId) {
  waitingWeatherCity[chatId] = true;
  return sendLocalizedMessage(
    chatId,
    "For which city should I show a 3-day forecast?\n\nExample: *Warsaw* or *Barcelona*",
    { parse_mode: "Markdown" }
  );
}

async function handleWeatherCity(chatId, cityName) {
  await bot.sendChatAction(chatId, "typing");
  userCity[chatId] = cityName;
  const weatherText = await getCachedWeather(cityName);
  return sendLocalizedMessage(chatId, weatherText, { parse_mode: "Markdown" });
}

async function handleNews(chatId) {
  await bot.sendChatAction(chatId, "typing");
  const text = await getCachedNews(3);
  return sendLocalizedMessage(chatId, text, { parse_mode: "Markdown" });
}

async function handleInfo(chatId, msg) {
  return sendLocalizedMessage(
    chatId,
    `Your name: ${msg.from.first_name}\nYour username: @${msg.from.username || "not set"}`
  );
}

async function handleDigest(chatId, receivedText) {
  const parts = receivedText.split(/\s+/);
  const cityFromCommand = parts.slice(1).join(" ").trim();
  const cityName = cityFromCommand || userCity[chatId];

  if (!cityName) {
    waitingDigestCity[chatId] = true;
    return sendLocalizedMessage(
      chatId,
      "For daily digest, send your city name (only city text), for example:\n`Warsaw`",
      { parse_mode: "Markdown" }
    );
  }

  waitingDigestCity[chatId] = false;
  userCity[chatId] = cityName;

  await bot.sendChatAction(chatId, "typing");
  const digest = await buildDailyDigest(chatId, cityName);
  return sendLocalizedMessage(chatId, digest, { parse_mode: "Markdown" });
}

async function handleHoroscope(chatId, receivedText) {
  const parts = receivedText.split(/\s+/);
  const maybeSign = parts[1];

  if (maybeSign) {
    if (!isValidSign(maybeSign)) {
      return sendLocalizedMessage(
        chatId,
        "Unknown zodiac sign 🙂\nUse English sign names:\n`aries`, `taurus`, `gemini`, `cancer`, `leo`, `virgo`, `libra`, `scorpio`, `sagittarius`, `capricorn`, `aquarius`, `pisces`",
        { parse_mode: "Markdown" }
      );
    }

    const normalized = normalizeSign(maybeSign);
    userZodiac[chatId] = normalized;
    waitingHoroscopeSign[chatId] = false;

    await bot.sendChatAction(chatId, "typing");
    const text = await getCachedHoroscope(normalized);
    return sendLocalizedMessage(chatId, text, { parse_mode: "Markdown" });
  }

  const savedSign = userZodiac[chatId];
  if (!savedSign) {
    waitingHoroscopeSign[chatId] = true;
    return sendLocalizedMessage(
      chatId,
      "I do not know your zodiac sign yet 🙂\n\nPlease send only your sign name, for example:\n`leo`\n`pisces`\n\nAfter that, you can use `/horoscope` without a sign.",
      { parse_mode: "Markdown" }
    );
  }

  await bot.sendChatAction(chatId, "typing");
  const text = await getCachedHoroscope(savedSign);
  return sendLocalizedMessage(chatId, text, { parse_mode: "Markdown" });
}

async function handleHoroscopeSignInput(chatId, signText) {
  if (!isValidSign(signText)) {
    return sendLocalizedMessage(
      chatId,
      "Unknown zodiac sign 🙂\nUse English sign names:\n`aries`, `taurus`, `gemini`, `cancer`, `leo`, `virgo`, `libra`, `scorpio`, `sagittarius`, `capricorn`, `aquarius`, `pisces`",
      { parse_mode: "Markdown" }
    );
  }

  const normalized = normalizeSign(signText);
  userZodiac[chatId] = normalized;
  waitingHoroscopeSign[chatId] = false;

  await bot.sendChatAction(chatId, "typing");
  const text = await getCachedHoroscope(normalized);
  return sendLocalizedMessage(chatId, text, { parse_mode: "Markdown" });
}

async function handleAIFallback(chatId, msg, receivedText) {
  await bot.sendChatAction(chatId, "typing");
  const userName = msg.from?.first_name || msg.from?.username || "friend";
  const aiReply = await askAI(receivedText, userName);
  return sendLocalizedMessage(chatId, aiReply);
}

async function transcribeTelegramVoice(fileId) {
  const fileUrl = await bot.getFileLink(fileId);
  const audioRes = await fetch(fileUrl);
  if (!audioRes.ok) {
    throw new Error(`Could not download voice file (${audioRes.status})`);
  }

  const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
  return transcribeAudioBuffer(audioBuffer, "voice.ogg");
}

async function handleVoiceMessage(chatId, msg) {
  if (!msg.voice?.file_id) {
    return sendLocalizedMessage(chatId, "Voice file is missing. Please try again.");
  }

  await bot.sendChatAction(chatId, "typing");
  const { text: transcript, language } = await transcribeTelegramVoice(msg.voice.file_id);

  const detectedCode = normalizeDetectedLanguageCode(language);
  const currentCode = getLanguageCode(chatId);
  if (detectedCode && detectedCode !== currentCode) {
    userLanguage[chatId] = detectedCode;
  }

  await sendLocalizedMessage(chatId, `🗣 Transcript: ${transcript}`);
  return handleAIFallback(chatId, msg, transcript);
}

const commandHandlers = {
  "/digest": async (chatId, _msg, receivedText) => handleDigest(chatId, receivedText),
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

  if (msg.voice) {
    try {
      return await handleVoiceMessage(chatId, msg);
    } catch (err) {
      console.error("Voice processing error:", err);
      return sendLocalizedMessage(
        chatId,
        "Could not process voice message 😔 Please send text or try voice again later."
      );
    }
  }

  if (!receivedText) return;

  const command = receivedText.split(/\s+/)[0];

  if (command === "/start") {
    return handleStart(chatId);
  }

  if (command === "/language") {
    return promptLanguageSelection(chatId);
  }

  if (!hasLanguage(chatId)) {
    await sendLocalizedMessage(chatId, "Please choose a language first.");
    return promptLanguageSelection(chatId);
  }

  if (waitingWeatherCity[chatId] && !receivedText.startsWith("/")) {
    const cityName = receivedText.trim();
    waitingWeatherCity[chatId] = false;

    try {
      return await handleWeatherCity(chatId, cityName);
    } catch (err) {
      console.error("Weather error:", err);
      return sendLocalizedMessage(
        chatId,
        "Could not get the weather 😔 Try another city format, for example: *Warsaw* or *Barcelona*.",
        { parse_mode: "Markdown" }
      );
    }
  }

  if (waitingDigestCity[chatId] && !receivedText.startsWith("/")) {
    try {
      return await handleDigest(chatId, `/digest ${receivedText.trim()}`);
    } catch (err) {
      console.error("Digest error:", err);
      return sendLocalizedMessage(
        chatId,
        "Could not build daily digest 😔 Please try again later."
      );
    }
  }

  if (waitingHoroscopeSign[chatId] && !receivedText.startsWith("/")) {
    try {
      return await handleHoroscopeSignInput(chatId, receivedText.trim());
    } catch (err) {
      console.error("Horoscope sign input error:", err);
      return sendLocalizedMessage(
        chatId,
        "Could not fetch horoscope 😔 The source website may be temporarily unavailable or changed."
      );
    }
  }

  if (receivedText.startsWith("/horoscope")) {
    try {
      return await handleHoroscope(chatId, receivedText);
    } catch (err) {
      console.error("Horoscope error:", err);
      return sendLocalizedMessage(
        chatId,
        "Could not fetch horoscope 😔 The source website may be temporarily unavailable or changed."
      );
    }
  }

  const handler = commandHandlers[command];
  if (handler) {
    try {
      return await handler(chatId, msg, receivedText);
    } catch (err) {
      console.error(`Command error (${command}):`, err);
      return sendLocalizedMessage(chatId, "Something went wrong. Please try again later.");
    }
  }

  try {
    return await handleAIFallback(chatId, msg, receivedText);
  } catch (err) {
    console.error("AI error:", err);
    return sendLocalizedMessage(chatId, "Something went wrong with AI. Please try again a bit later 🙈");
  }
});

bot.on("callback_query", async (callbackQuery) => {
  const message = callbackQuery.message;
  if (!message) return;

  const chatId = message.chat.id;
  const data = callbackQuery.data;

  if (data?.startsWith("lang:")) {
    const selected = data.split(":")[1];

    if (!LANGUAGES[selected]) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "Unsupported language",
        show_alert: true,
      });
      return;
    }

    userLanguage[chatId] = selected;
    await bot.answerCallbackQuery(callbackQuery.id);

    await sendLocalizedMessage(chatId, `Language saved: ${LANGUAGES[selected]}.`);
    return sendAvailableOptions(chatId);
  }

  if (data === "again") {
    await bot.answerCallbackQuery(callbackQuery.id);
    return startGame(chatId);
  }

  const userGuess = Number(data);
  const correctNumber = chats[chatId];

  if (correctNumber === undefined) {
    await bot.answerCallbackQuery(callbackQuery.id);
    return sendLocalizedMessage(chatId, "No active round yet. Send /game to start a new one 🙂");
  }

  const text =
    userGuess === correctNumber
      ? `🎉 Nice! You guessed the correct number: ${correctNumber}`
      : `😔 Not this time. The correct number was ${correctNumber}. Try again!`;

  delete chats[chatId];

  await bot.answerCallbackQuery(callbackQuery.id);

  let playAgainLabel = "Play again";
  if (hasLanguage(chatId)) {
    try {
      playAgainLabel = await localizeText(chatId, playAgainLabel);
    } catch (err) {
      console.error("Play-again translation error:", err);
    }
  }

  return sendLocalizedMessage(chatId, text, createAgainOptions(playAgainLabel));
});

console.log("Bot is running...");

