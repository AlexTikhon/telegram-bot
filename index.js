// bot.js
const TelegramBot = require('node-telegram-bot-api');

const { gameOptions, againOptions } = require('./options');
const { token } = require('./env');

const bot = new TelegramBot(token, { polling: true });

bot.setMyCommands([
  { command: '/start', description: 'Start the bot' },
  { command: '/info', description: 'Get information about yourself' },
  { command: '/game', description: 'Play a game - find a number' },
]);

const chats = {}; // { [chatId]: number }

const startGame = async (chatId) => {
  const randomNumber = Math.floor(Math.random() * 10);
  chats[chatId] = randomNumber;

  await bot.sendMessage(
    chatId,
    "Let's play a game! I have selected a number between 0 and 9. Can you guess it?"
  );

  return bot.sendMessage(chatId, 'Choose a number:', gameOptions);
};

bot.on('message', async (msg) => {
  console.log(msg);

  const chatId = msg.chat.id;
  const receivedText = msg.text;

  if (!receivedText) {
    return;
  }

  if (receivedText === '/start') {
    await bot.sendSticker(chatId, 'CAACAgIAAxkBAAMTaVF8fmf6BZs2oQi29D5iu3sOW1AAAv8CAAJtsEIDBKA5qzQCNjc2BA');
    return bot.sendMessage(chatId, 'Welcome! How can I assist you today?');
  }

  if (receivedText === '/game') {
    return startGame(chatId);
  }

  if (receivedText === '/again') {
    return startGame(chatId);
  }

  if (receivedText === '/info') {
    return bot.sendMessage(
      chatId,
      `Your first name is ${msg.from.first_name}\n` +
      `Your last name is ${msg.from.last_name || 'not provided'}\n` +
      `Your username is @${msg.from.username || 'not provided'}`
    );
  }

  return bot.sendMessage(chatId, `You said: ${receivedText}`);
});

bot.on('callback_query', async (callbackQuery) => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;
  const data = callbackQuery.data;

  if (data === 'again') {
    await bot.answerCallbackQuery(callbackQuery.id);
    return startGame(chatId);
  }

  const userGuess = Number(data);
  const correctNumber = chats[chatId];

  if (correctNumber === undefined) {
    await bot.answerCallbackQuery(callbackQuery.id);
    return bot.sendMessage(
      chatId,
      'I have not selected a number yet. Send /game to start a new game 🙂'
    );
  }

  let text;
  if (userGuess === correctNumber) {
    text = `🎉 Congratulations! You guessed the correct number: ${correctNumber}`;
  } else {
    text = `😔 Sorry, the correct number was ${correctNumber}. Better luck next time!`;
  }

  delete chats[chatId];

  await bot.answerCallbackQuery(callbackQuery.id);
  await bot.sendMessage(chatId, text, againOptions);
});

console.log('Bot is running…');
