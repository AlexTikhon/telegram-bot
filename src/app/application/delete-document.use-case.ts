import { deleteDocumentChunks } from "../rag/vector-store/delete-document-chunks.js";
import { AppError } from "../shared/errors/app-error.js";
import { FileStorageService } from "../documents/services/file-storage.service.js";
import { DocumentMetadataService } from "../documents/services/document-metadata.service.js";
import type { DocumentRepository } from "../documents/repositories/document.repository.js";

/** Deletes a document and all of its derived artifacts. */
export class DeleteDocumentUseCase {
  private readonly fileStorageService = new FileStorageService();
  private readonly documentMetadataService: DocumentMetadataService;

  constructor(documentRepository: DocumentRepository) {
    this.documentMetadataService = new DocumentMetadataService(documentRepository);
  }

  /** Removes document chunks, metadata, and the original uploaded file. */
  async execute(userId: string, documentId: string) {
    const document = this.documentMetadataService.getDocument(userId, documentId);
    if (!document) {
      throw new AppError("Document not found.", "NOT_FOUND");
    }

    await deleteDocumentChunks(userId, documentId);
    this.documentMetadataService.deleteDocument(userId, documentId);
    await this.fileStorageService.delete(document.storedName);
  }
}
