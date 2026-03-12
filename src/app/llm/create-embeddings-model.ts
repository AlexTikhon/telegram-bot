import { OpenAIEmbeddings } from "@langchain/openai";
import { env } from "../config/env.js";

/** Creates the embeddings model used for chunk and query vectorization. */
export function createEmbeddingsModel() {
  return new OpenAIEmbeddings({
    model: env.OPENAI_EMBEDDINGS_MODEL,
    apiKey: env.OPENAI_API_KEY,
  });
}
