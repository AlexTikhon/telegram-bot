import type { Context } from "telegraf";
import { messages } from "../ui/messages.js";
import type { ListDocumentsUseCase } from "../../application/list-documents.use-case.js";

/** Handles `/list` and formats indexed documents for the current user. */
export async function listHandler(ctx: Context, listDocumentsUseCase: ListDocumentsUseCase) {
  const userId = String(ctx.from?.id);
  const documents = listDocumentsUseCase.execute(userId);

  if (documents.length === 0) {
    await ctx.reply(messages.emptyDocuments);
    return;
  }

  const text = documents
    .map((document: { id: string; fileName: string; textLength: number }) => `${document.id}\n${document.fileName} (${document.textLength} chars)`)
    .join("\n\n");

  await ctx.reply(text);
}
