import type { DocumentRecord, StoredChunkRecord } from "../types/document.types.js";

type RawDocumentRow = {
  id: string;
  user_id: string;
  file_name: string;
  stored_name: string;
  mime_type: string;
  file_size: number;
  text_length: number;
  summary: string | null;
  created_at: string;
};

type RawChunkRow = {
  id: string;
  document_id: string;
  user_id: string;
  chunk_index: number;
  content: string;
  embedding: string;
  source_label: string;
  created_at: string;
};

/** Converts a raw database row into the document domain shape. */
function mapDocument(row: RawDocumentRow): DocumentRecord {
  return {
    id: row.id,
    userId: row.user_id,
    fileName: row.file_name,
    storedName: row.stored_name,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    textLength: row.text_length,
    summary: row.summary,
    createdAt: row.created_at,
  };
}

/** Converts a raw chunk row and deserializes the stored embedding vector. */
function mapChunk(row: RawChunkRow): StoredChunkRecord {
  return {
    id: row.id,
    documentId: row.document_id,
    userId: row.user_id,
    chunkIndex: row.chunk_index,
    content: row.content,
    embedding: JSON.parse(row.embedding) as number[],
    sourceLabel: row.source_label,
    createdAt: row.created_at,
  };
}

/** SQLite-backed repository for documents and chunk metadata. */
export class DocumentRepository {
  constructor(private readonly db: any) {}

  /** Inserts a single document metadata record. */
  createDocument(document: DocumentRecord) {
    const stmt = this.db.prepare(`
      INSERT INTO documents (id, user_id, file_name, stored_name, mime_type, file_size, text_length, summary, created_at)
      VALUES (@id, @userId, @fileName, @storedName, @mimeType, @fileSize, @textLength, @summary, @createdAt)
    `);
    stmt.run(document);
  }

  /** Lists the user's documents in reverse chronological order. */
  listDocumentsByUser(userId: string) {
    const stmt = this.db.prepare(`
      SELECT * FROM documents
      WHERE user_id = ?
      ORDER BY datetime(created_at) DESC
    `);
    return (stmt.all(userId) as RawDocumentRow[]).map(mapDocument);
  }

  /** Fetches one document that belongs to the given user. */
  getDocumentById(userId: string, documentId: string) {
    const stmt = this.db.prepare(`
      SELECT * FROM documents
      WHERE user_id = ? AND id = ?
    `);
    const row = stmt.get(userId, documentId) as RawDocumentRow | undefined;
    return row ? mapDocument(row) : null;
  }

  /** Deletes a single document record and returns the change count. */
  deleteDocument(userId: string, documentId: string) {
    const stmt = this.db.prepare(`
      DELETE FROM documents
      WHERE user_id = ? AND id = ?
    `);
    return stmt.run(userId, documentId).changes;
  }

  /** Updates a previously generated document summary. */
  updateSummary(userId: string, documentId: string, summary: string) {
    const stmt = this.db.prepare(`
      UPDATE documents
      SET summary = ?
      WHERE user_id = ? AND id = ?
    `);
    stmt.run(summary, userId, documentId);
  }

  /** Persists chunk rows in one transaction to keep inserts atomic. */
  insertChunks(chunks: StoredChunkRecord[]) {
    const stmt = this.db.prepare(`
      INSERT INTO document_chunks (id, document_id, user_id, chunk_index, content, embedding, source_label, created_at)
      VALUES (@id, @documentId, @userId, @chunkIndex, @content, @embedding, @sourceLabel, @createdAt)
    `);

    const transaction = this.db.transaction((rows: StoredChunkRecord[]) => {
      for (const chunk of rows) {
        stmt.run({
          ...chunk,
          embedding: JSON.stringify(chunk.embedding),
        });
      }
    });

    transaction(chunks);
  }

  /** Lists all chunks for a user, optionally narrowed to one document. */
  listChunksByUser(userId: string, documentId?: string) {
    const query = documentId
      ? "SELECT * FROM document_chunks WHERE user_id = ? AND document_id = ? ORDER BY chunk_index ASC"
      : "SELECT * FROM document_chunks WHERE user_id = ? ORDER BY created_at DESC";
    const stmt = this.db.prepare(query);
    const rows = (documentId ? stmt.all(userId, documentId) : stmt.all(userId)) as RawChunkRow[];
    return rows.map(mapChunk);
  }

  /** Deletes all chunks that belong to a specific document. */
  deleteChunksByDocument(userId: string, documentId: string) {
    const stmt = this.db.prepare(`
      DELETE FROM document_chunks
      WHERE user_id = ? AND document_id = ?
    `);
    stmt.run(userId, documentId);
  }
}
