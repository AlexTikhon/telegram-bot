import { createBot } from "./app/bot/bot.js";
import { env } from "./app/config/env.js";
import { logger } from "./app/shared/logger/logger.js";

async function bootstrap() {
  const bot = await createBot();
  await bot.launch();
  logger.info(`Bot launched in ${env.NODE_ENV} mode`);
}

bootstrap().catch((error) => {
  logger.error("Failed to start application", error);
  process.exit(1);
});

process.once("SIGINT", () => process.exit(0));
process.once("SIGTERM", () => process.exit(0));
