import type { Context } from "telegraf";
import type { SummarizeDocumentUseCase } from "../../application/summarize-document.use-case.js";

/** Handles `/summary` requests for a specific document. */
export async function summaryHandler(
  ctx: Context,
  summarizeDocumentUseCase: SummarizeDocumentUseCase,
  documentId: string,
) {
  if (!documentId) {
    await ctx.reply("Use `/summary <documentId>`.", { parse_mode: "Markdown" });
    return;
  }

  const result = await summarizeDocumentUseCase.execute(String(ctx.from?.id), documentId);
  await ctx.reply(`Summary for ${result.document.fileName}:\n\n${result.summary}`);
}
