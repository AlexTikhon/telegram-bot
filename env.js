require('dotenv').config();

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is not set in .env');
}

export const token = process.env.TELEGRAM_BOT_TOKEN;
export const openAIApiKey = process.env.OPENAI_API_KEY || '';
