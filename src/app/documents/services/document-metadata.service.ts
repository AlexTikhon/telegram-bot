import type { DocumentRepository } from "../repositories/document.repository.js";
import type { DocumentRecord } from "../types/document.types.js";

/** Thin service layer for document metadata persistence. */
export class DocumentMetadataService {
  constructor(private readonly documentRepository: DocumentRepository) {}

  /** Persists a new document record. */
  createDocument(document: DocumentRecord) {
    this.documentRepository.createDocument(document);
  }

  /** Returns documents owned by a specific user. */
  listDocuments(userId: string) {
    return this.documentRepository.listDocumentsByUser(userId);
  }

  /** Looks up one document for a specific user. */
  getDocument(userId: string, documentId: string) {
    return this.documentRepository.getDocumentById(userId, documentId);
  }

  /** Stores a generated summary for later reuse. */
  updateSummary(userId: string, documentId: string, summary: string) {
    this.documentRepository.updateSummary(userId, documentId, summary);
  }

  /** Deletes a document record from metadata storage. */
  deleteDocument(userId: string, documentId: string) {
    return this.documentRepository.deleteDocument(userId, documentId);
  }
}
