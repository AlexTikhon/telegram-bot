import Database from "better-sqlite3";
import path from "node:path";
import { SQLITE_PATH } from "../config/constants.js";
import { ensureDir } from "../shared/utils/file.js";

let dbInstance: Database.Database | null = null;

/** Creates tables and indexes required by the application on first startup. */
function initializeSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      mime_type TEXT,
      file_size INTEGER NOT NULL,
      text_length INTEGER NOT NULL,
      summary TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS document_chunks (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      embedding TEXT NOT NULL,
      source_label TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
    CREATE INDEX IF NOT EXISTS idx_chunks_user_id ON document_chunks(user_id);
    CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON document_chunks(document_id);
  `);
}

/** Returns a shared SQLite connection and initializes the schema once. */
export async function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  await ensureDir(path.dirname(SQLITE_PATH));
  dbInstance = new Database(SQLITE_PATH);
  dbInstance.pragma("foreign_keys = ON");
  initializeSchema(dbInstance);
  return dbInstance;
}
