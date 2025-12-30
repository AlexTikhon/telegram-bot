// bot.js
import TelegramBot from "node-telegram-bot-api";
import express from "express";
import { gameOptions, againOptions } from "./options.js";
import { askAI } from "./ai.js";
import "dotenv/config";
import { getWeather3Days } from "./weather.js";
import { getLatestRussianSpaceNews } from "./news.js";
import { getDailyHoroscopeFromWeb } from "./horoscope.js";
import { getDailyTarotSpread } from "./tarot.js";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN is missing in .env");
}

// понимаем: мы в облаке Render или локально
const isRender = !!process.env.RENDER_EXTERNAL_URL;

// создаём бота
const bot = new TelegramBot(token, {
  polling: !isRender, // локально — polling, в облаке — нет
});

// ------- HTTP-сервер для webhook (Render) -------

if (isRender) {
  const app = express();
  app.use(express.json());

  const externalUrl = process.env.RENDER_EXTERNAL_URL; // типа https://my-bot.onrender.com
  const webhookPath = `/webhook/${token}`;
  const webhookUrl = `${externalUrl}${webhookPath}`;

  // на всякий случай: лог
  console.log("Render external URL:", externalUrl);
  console.log("Webhook URL:", webhookUrl);

  // регистрируем webhook у Telegram
  bot.setWebHook(webhookUrl).then(() => {
    console.log("Webhook set successfully");
  }).catch(err => {
    console.error("Error setting webhook:", err);
  });

  // сюда Telegram будет слать обновления
  app.post(webhookPath, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });

  // простой healthcheck
  app.get("/", (_, res) => {
    res.send("Bot is running.");
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Express server listening on port ${port}`);
  });
}

bot.setMyCommands([
  { command: "/start", description: "Запустить бота" },
  { command: "/tarot", description: "Таро-расклад на сегодня (3 карты)" },
  { command: "/horoscope", description: "Гороскоп на сегодня (из интернета)" },
  { command: "/weather", description: "Погода на 3 дня" },
  { command: "/news", description: "Узнать что-то новое из науки/космоса" },
  { command: "/game", description: "Играть в угадай число" },
  { command: "/info", description: "Получить информацию о себе" },
]);

// Память для игры
const chats = {}; // { [chatId]: number }
const waitingWeatherCity = {}; // { [chatId]: true | undefined }
const userZodiac = {};

const zodiacSigns = [
  "овен",
  "телец",
  "близнецы",
  "рак",
  "лев",
  "дева",
  "весы",
  "скорпион",
  "стрелец",
  "козерог",
  "водолей",
  "рыбы",
];

function normalizeSign(text) {
  return text.toLowerCase().trim();
}

function isValidSign(text) {
  return zodiacSigns.includes(normalizeSign(text));
}

const startGame = async (chatId) => {
  const randomNumber = Math.floor(Math.random() * 10);
  chats[chatId] = randomNumber;

  await bot.sendMessage(
    chatId,
    "Давай сыграем в игру: угадай число от 0 до 9!"
  );

  return bot.sendMessage(chatId, "Choose a number:", gameOptions);
};

bot.on("message", async (msg) => {
  console.log(msg);

  const chatId = msg.chat.id;
  const receivedText = msg.text;

  if (!receivedText) return;

  // 1. Если ранее попросили ввести город — обрабатываем как запрос погоды
  if (waitingWeatherCity[chatId] && !receivedText.startsWith("/")) {
    const cityName = receivedText.trim();
    waitingWeatherCity[chatId] = false;

    try {
      await bot.sendChatAction(chatId, "typing");
      const weatherText = await getWeather3Days(cityName);
      return bot.sendMessage(chatId, weatherText, { parse_mode: "Markdown" });
    } catch (err) {
      console.error("Weather error:", err);
      return bot.sendMessage(
        chatId,
        "Не получилось получить погоду 😔 Попробуй указать город иначе, например: *Warsaw* или *Barcelona*.",
        { parse_mode: "Markdown" }
      );
    }
  }

  // 2. Команды
  if (receivedText === "/start") {
    await bot.sendSticker(
      chatId,
      "CAACAgIAAxkBAAMTaVF8fmf6BZs2oQi29D5iu3sOW1AAAv8CAAJtsEIDBKA5qzQCNjc2BA"
    );
    return bot.sendMessage(
      chatId,
      "Добро пожаловать! Как я могу помочь вам сегодня?"
    );
  }

  if (receivedText === "/tarot") {
    try {
      await bot.sendChatAction(chatId, "typing");
      const spreadText = getDailyTarotSpread(chatId);
      return bot.sendMessage(chatId, spreadText, { parse_mode: "Markdown" });
    } catch (err) {
      console.error("Tarot error:", err);
      return bot.sendMessage(
        chatId,
        "Не получилось сделать расклад таро 😔 Попробуй чуть позже."
      );
    }
  }

  if (receivedText.startsWith("/horoscope")) {
    const parts = receivedText.split(/\s+/);
    const maybeSign = parts[1];

    // 1) Если знак явно передан: /horoscope лев
    if (maybeSign) {
      if (!isValidSign(maybeSign)) {
        return bot.sendMessage(
          chatId,
          "Я не узнал такой знак зодиака 🙂\n" +
          "Попробуй так:\n" +
          "овен, телец, близнецы, рак, лев, дева,\n" +
          "весы, скорпион, стрелец, козерог, водолей, рыбы"
        );
      }

      const normalized = normalizeSign(maybeSign);
      // запоминаем за пользователем
      userZodiac[chatId] = normalized;

      try {
        await bot.sendChatAction(chatId, "typing");
        const text = await getDailyHoroscopeFromWeb(normalized);
        return bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
      } catch (err) {
        console.error("Horoscope error:", err);
        return bot.sendMessage(
          chatId,
          "Не удалось получить гороскоп 😔 Возможно, сайт поменял разметку или временно недоступен."
        );
      }
    }

    // 2) Если знак не передан: /horoscope
    const savedSign = userZodiac[chatId];

    if (!savedSign) {
      return bot.sendMessage(
        chatId,
        "Я пока не знаю твой знак зодиака 🙂\n\n" +
        "Напиши так, чтобы я запомнил:\n" +
        "/horoscope лев\n/horoscope рыбы\n\n" +
        "Потом можно будет просто вызывать /horoscope без знака."
      );
    }

    // Есть сохранённый знак — используем его
    try {
      await bot.sendChatAction(chatId, "typing");
      const text = await getDailyHoroscopeFromWeb(savedSign);
      return bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
    } catch (err) {
      console.error("Horoscope (saved sign) error:", err);
      return bot.sendMessage(
        chatId,
        "Не удалось получить гороскоп 😔 Возможно, сайт поменял разметку или временно недоступен."
      );
    }
  }

  if (receivedText === "/weather") {
    waitingWeatherCity[chatId] = true;
    return bot.sendMessage(
      chatId,
      "Для какого города показать погоду на ближайшие 3 дня?\n\nНапример: *Warsaw* или *Barcelona*",
      { parse_mode: "Markdown" }
    );
  }

  if (receivedText === "/news") {
    try {
      await bot.sendChatAction(chatId, "typing");

      const text = await getLatestRussianSpaceNews(3);

      return bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
    } catch (err) {
      console.error("News error:", err);
      return bot.sendMessage(
        chatId,
        "Не получилось получить русскоязычные новости 😔 Попробуй позже."
      );
    }
  }

  if (receivedText === "/game") {
    return startGame(chatId);
  }

  if (receivedText === "/again") {
    return startGame(chatId);
  }

  if (receivedText === "/info") {
    return bot.sendMessage(
      chatId,
      `Ваше имя: ${msg.from.first_name}\n` +
      `Ваш никнейм: @${msg.from.username || "не указан"}`
    );
  }

  // 3. Всё остальное — в ИИ
  try {
    await bot.sendChatAction(chatId, "typing");

    const userName = msg.from?.first_name || msg.from?.username || "друг";
    const aiReply = await askAI(receivedText, userName);

    return bot.sendMessage(chatId, aiReply);
  } catch (err) {
    console.error("AI error:", err);
    return bot.sendMessage(
      chatId,
      "Что-то пошло не так с ИИ. Попробуй ещё раз чуть позже 🙈"
    );
  }
});

// Игра — обработчик inline-кнопок
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
    return bot.sendMessage(
      chatId,
      "Я еще не выбрал число. Отправь /game, чтобы начать новую игру 🙂"
    );
  }

  let text;
  if (userGuess === correctNumber) {
    text = `🎉 Поздравляю! Вы угадали правильное число: ${correctNumber}`;
  } else {
    text = `😔 К сожалению, правильное число было ${correctNumber}. Удачи в следующий раз!`;
  }

  delete chats[chatId];

  await bot.answerCallbackQuery(callbackQuery.id);
  await bot.sendMessage(chatId, text, againOptions);
});

console.log("Bot is running…");
