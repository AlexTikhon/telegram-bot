import type { RetrievedChunk } from "../types/rag.types.js";

/** Formats retrieved chunks into a prompt-friendly numbered context block. */
export function formatContext(chunks: RetrievedChunk[]) {
  return chunks
    .map(
      (chunk, index) =>
        `[${index + 1}] Source: ${chunk.sourceLabel}\n${chunk.content}`,
    )
    .join("\n\n");
}
