import { getDb } from "../../db/sqlite.js";
import { DocumentRepository } from "../../documents/repositories/document.repository.js";

/** Builds the current vector-store abstraction backed by SQLite. */
export async function createVectorStore() {
  const db = await getDb();
  return new DocumentRepository(db);
}
