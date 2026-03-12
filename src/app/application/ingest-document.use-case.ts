import { randomUUID } from "node:crypto";
import { ValidationError } from "../shared/errors/validation-error.js";
import { SUPPORTED_EXTENSIONS } from "../config/constants.js";
import { getFileExtension } from "../shared/utils/path.js";
import { loadDocument } from "../rag/loaders/load-document.js";
import { splitDocument } from "../rag/splitters/split-document.js";
import { createEmbeddings } from "../rag/embeddings/create-embeddings.js";
import { mapChunksToStoredChunks } from "../rag/mappers/chunk-to-document.js";
import { upsertChunks } from "../rag/vector-store/upsert-chunks.js";
import { FileStorageService } from "../documents/services/file-storage.service.js";
import { DocumentMetadataService } from "../documents/services/document-metadata.service.js";
import type { DocumentRepository } from "../documents/repositories/document.repository.js";

/** Orchestrates document upload, parsing, chunking, embedding, and persistence. */
export class IngestDocumentUseCase {
  private readonly fileStorageService = new FileStorageService();
  private readonly documentMetadataService: DocumentMetadataService;

  constructor(documentRepository: DocumentRepository) {
    this.documentMetadataService = new DocumentMetadataService(documentRepository);
  }

  /** Validates the upload and stores both document metadata and vectorized chunks. */
  async execute(params: {
    userId: string;
    fileName: string;
    mimeType: string;
    buffer: Buffer;
    fileSize: number;
  }) {
    const extension = getFileExtension(params.fileName);
    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      throw new ValidationError("Unsupported file type. Send PDF, MD, or TXT.");
    }

    const { fullPath, storedName } = await this.fileStorageService.save(params.fileName, params.buffer);
    const loaded = await loadDocument(params.fileName, params.mimeType, params.buffer);

    if (!loaded.text) {
      throw new ValidationError("Could not extract text from the uploaded file.");
    }

    const chunks = await splitDocument(loaded.text);
    if (chunks.length === 0) {
      throw new ValidationError("The document does not contain enough text to index.");
    }

    const embeddings = await createEmbeddings(chunks.map((chunk) => chunk.content));
    const documentId = randomUUID();
    const createdAt = new Date().toISOString();

    this.documentMetadataService.createDocument({
      id: documentId,
      userId: params.userId,
      fileName: params.fileName,
      storedName,
      mimeType: params.mimeType,
      fileSize: params.fileSize,
      textLength: loaded.text.length,
      summary: null,
      createdAt,
    });

    await upsertChunks(
      mapChunksToStoredChunks({
        userId: params.userId,
        documentId,
        fileName: params.fileName,
        chunks,
        embeddings,
      }),
    );

    return {
      documentId,
      fileName: params.fileName,
      fullPath,
      chunksCount: chunks.length,
      textLength: loaded.text.length,
    };
  }
}
