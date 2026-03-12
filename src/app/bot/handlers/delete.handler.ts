import type { Context } from "telegraf";
import type { DeleteDocumentUseCase } from "../../application/delete-document.use-case.js";

/** Handles `/delete` requests for a specific document. */
export async function deleteHandler(
  ctx: Context,
  deleteDocumentUseCase: DeleteDocumentUseCase,
  documentId: string,
) {
  if (!documentId) {
    await ctx.reply("Use `/delete <documentId>`.", { parse_mode: "Markdown" });
    return;
  }

  await deleteDocumentUseCase.execute(String(ctx.from?.id), documentId);
  await ctx.reply(`Deleted document ${documentId}.`);
}
