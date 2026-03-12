import { MAX_SUMMARY_SOURCE_CHARS } from "../config/constants.js";
import { summarizeDocumentChain } from "../rag/chains/summarize-document.chain.js";
import { truncateText } from "../shared/utils/text.js";
import { AppError } from "../shared/errors/app-error.js";
import { DocumentMetadataService } from "../documents/services/document-metadata.service.js";
import type { DocumentRepository } from "../documents/repositories/document.repository.js";

/** Produces and caches a short summary for a stored document. */
export class SummarizeDocumentUseCase {
  private readonly documentMetadataService: DocumentMetadataService;

  constructor(private readonly documentRepository: DocumentRepository) {
    this.documentMetadataService = new DocumentMetadataService(documentRepository);
  }

  /** Reuses a cached summary when available, otherwise builds one from stored chunks. */
  async execute(userId: string, documentId: string) {
    const document = this.documentMetadataService.getDocument(userId, documentId);
    if (!document) {
      throw new AppError("Document not found.", "NOT_FOUND");
    }

    if (document.summary) {
      return {
        document,
        summary: document.summary,
      };
    }

    const chunks = this.documentRepository.listChunksByUser(userId, documentId);
    const sourceText = truncateText(
      chunks.map((chunk: { content: string }) => chunk.content).join("\n\n"),
      MAX_SUMMARY_SOURCE_CHARS,
    );
    const summary = await summarizeDocumentChain(sourceText);

    this.documentMetadataService.updateSummary(userId, documentId, summary);

    return {
      document,
      summary,
    };
  }
}
