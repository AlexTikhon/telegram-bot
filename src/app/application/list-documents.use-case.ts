import { DocumentMetadataService } from "../documents/services/document-metadata.service.js";
import type { DocumentRepository } from "../documents/repositories/document.repository.js";

/** Returns the current user's indexed documents. */
export class ListDocumentsUseCase {
  private readonly documentMetadataService: DocumentMetadataService;

  constructor(documentRepository: DocumentRepository) {
    this.documentMetadataService = new DocumentMetadataService(documentRepository);
  }

  /** Delegates document listing to the metadata service. */
  execute(userId: string) {
    return this.documentMetadataService.listDocuments(userId);
  }
}
