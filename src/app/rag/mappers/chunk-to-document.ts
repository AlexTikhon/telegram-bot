import { randomUUID } from "node:crypto";
import type { StoredChunkRecord } from "../../documents/types/document.types.js";
import type { ChunkDraft } from "../types/rag.types.js";

/** Combines chunk drafts with embeddings into storable chunk records. */
export function mapChunksToStoredChunks(params: {
  userId: string;
  documentId: string;
  fileName: string;
  chunks: ChunkDraft[];
  embeddings: number[][];
}): StoredChunkRecord[] {
  return params.chunks.map((chunk, index) => ({
    id: randomUUID(),
    documentId: params.documentId,
    userId: params.userId,
    chunkIndex: chunk.chunkIndex,
    content: chunk.content,
    embedding: params.embeddings[index],
    sourceLabel: `${params.fileName}#chunk-${chunk.chunkIndex + 1}`,
    createdAt: new Date().toISOString(),
  }));
}
