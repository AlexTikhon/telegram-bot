import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_CHAT_MODEL: z.string().default("gpt-4.1-mini"),
  OPENAI_EMBEDDINGS_MODEL: z.string().default("text-embedding-3-small"),
  OPENAI_TRANSCRIBE_MODEL: z.string().default("whisper-1"),
  NODE_ENV: z.string().default("development"),
});

export const env = envSchema.parse(process.env);
