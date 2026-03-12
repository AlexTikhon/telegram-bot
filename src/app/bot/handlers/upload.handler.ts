import type { Context } from "telegraf";
import type { IngestDocumentUseCase } from "../../application/ingest-document.use-case.js";
import { messages } from "../ui/messages.js";

type UploadContext = Context & {
  message?: {
    document?: {
      file_id: string;
      file_name?: string;
      mime_type?: string;
      file_size?: number;
    };
  };
};

/** Downloads an uploaded Telegram document and sends it into the ingest pipeline. */
export async function uploadHandler(ctx: UploadContext, ingestDocumentUseCase: IngestDocumentUseCase) {
  const document = ctx.message?.document;
  if (!document?.file_id || !document.file_name) {
    await ctx.reply(messages.unsupportedFile);
    return;
  }

  const fileLink = await ctx.telegram.getFileLink(document.file_id);
  const response = await fetch(fileLink.href);
  const buffer = Buffer.from(await response.arrayBuffer());

  const result = await ingestDocumentUseCase.execute({
    userId: String(ctx.from?.id),
    fileName: document.file_name,
    mimeType: document.mime_type || "application/octet-stream",
    buffer,
    fileSize: document.file_size || buffer.byteLength,
  });

  await ctx.reply(
    [
      `Indexed ${result.fileName}.`,
      `Document ID: ${result.documentId}`,
      `Chunks: ${result.chunksCount}`,
      "You can now ask questions.",
    ].join("\n"),
  );
}
