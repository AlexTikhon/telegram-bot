export type LoadedDocument = {
  fileName: string;
  mimeType: string;
  text: string;
};

export type ChunkDraft = {
  chunkIndex: number;
  content: string;
};

export type RetrievedChunk = {
  id: string;
  documentId: string;
  content: string;
  sourceLabel: string;
  score: number;
};
