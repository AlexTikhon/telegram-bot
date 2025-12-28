// env.js
require('dotenv').config();

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is not set in .env');
}

module.exports = {
  token: process.env.TELEGRAM_BOT_TOKEN,
};
