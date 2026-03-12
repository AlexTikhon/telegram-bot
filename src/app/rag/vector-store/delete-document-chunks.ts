import { createVectorStore } from "./create-vector-store.js";

/** Removes all stored chunks associated with one document. */
export async function deleteDocumentChunks(userId: string, documentId: string) {
  const repository = await createVectorStore();
  repository.deleteChunksByDocument(userId, documentId);
}
