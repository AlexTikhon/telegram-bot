import type { StoredChunkRecord } from "../../documents/types/document.types.js";
import { createVectorStore } from "./create-vector-store.js";

/** Persists newly generated chunk records in the current vector store. */
export async function upsertChunks(chunks: StoredChunkRecord[]) {
  const repository = await createVectorStore();
  repository.insertChunks(chunks);
}
