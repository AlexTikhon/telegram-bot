export type DocumentRecord = {
  id: string;
  userId: string;
  fileName: string;
  storedName: string;
  mimeType: string;
  fileSize: number;
  textLength: number;
  summary: string | null;
  createdAt: string;
};

export type StoredChunkRecord = {
  id: string;
  documentId: string;
  userId: string;
  chunkIndex: number;
  content: string;
  embedding: number[];
  sourceLabel: string;
  createdAt: string;
};
