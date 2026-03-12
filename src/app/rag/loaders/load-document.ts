import { extractText } from "./extract-text.js";
import type { LoadedDocument } from "../types/rag.types.js";

/** Loads a raw upload and returns a normalized document payload. */
export async function loadDocument(
  fileName: string,
  mimeType: string,
  buffer: Buffer,
): Promise<LoadedDocument> {
  const text = await extractText(fileName, mimeType, buffer);

  return {
    fileName,
    mimeType,
    text,
  };
}
