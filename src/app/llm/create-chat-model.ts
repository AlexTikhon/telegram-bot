import { ChatOpenAI } from "@langchain/openai";
import { env } from "../config/env.js";

/** Creates the deterministic chat model used for answering and summarization. */
export function createChatModel() {
  return new ChatOpenAI({
    model: env.OPENAI_CHAT_MODEL,
    temperature: 0,
    apiKey: env.OPENAI_API_KEY,
  });
}
