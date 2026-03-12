import { Telegraf } from "telegraf";
import { env } from "../config/env.js";
import { registerHandlers } from "./register-handlers.js";
import { botCommands } from "./ui/commands.js";

/** Creates the Telegram bot instance and synchronizes its command menu. */
export async function createBot() {
  const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);

  await bot.telegram.setMyCommands(botCommands);
  await registerHandlers(bot);

  return bot;
}
