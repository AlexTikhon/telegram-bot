import { searchSimilarChunks } from "../vector-store/search-similar-chunks.js";

/** Retrieves the most relevant chunks for a user question. */
export async function retrieveContext(userId: string, question: string, documentId?: string) {
  return searchSimilarChunks({
    userId,
    question,
    documentId,
  });
}
