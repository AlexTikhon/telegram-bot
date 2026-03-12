import { CHUNK_OVERLAP, CHUNK_SIZE } from "../../config/constants.js";
import type { ChunkDraft } from "../types/rag.types.js";

/** Splits long text into overlapping chunks for retrieval and embeddings. */
export async function splitDocument(text: string): Promise<ChunkDraft[]> {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end));
    if (end >= text.length) {
      break;
    }
    start = Math.max(end - CHUNK_OVERLAP, 0);
  }

  return chunks
    .map((content: string, index: number) => ({
      chunkIndex: index,
      content: content.trim(),
    }))
    .filter((chunk: ChunkDraft) => chunk.content.length > 0);
}
