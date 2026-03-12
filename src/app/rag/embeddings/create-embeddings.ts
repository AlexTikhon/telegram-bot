import { createEmbeddingsModel } from "../../llm/create-embeddings-model.js";

/** Generates embedding vectors for a batch of chunk texts. */
export async function createEmbeddings(texts: string[]) {
  const embeddingsModel = createEmbeddingsModel();
  return embeddingsModel.embedDocuments(texts);
}
