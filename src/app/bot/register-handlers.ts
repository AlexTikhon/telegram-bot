import type { Telegraf } from "telegraf";
import type { Context } from "telegraf";
import { AnswerQuestionUseCase } from "../application/answer-question.use-case.js";
import { DeleteDocumentUseCase } from "../application/delete-document.use-case.js";
import { IngestDocumentUseCase } from "../application/ingest-document.use-case.js";
import { ListDocumentsUseCase } from "../application/list-documents.use-case.js";
import { SummarizeDocumentUseCase } from "../application/summarize-document.use-case.js";
import { getDb } from "../db/sqlite.js";
import { DocumentRepository } from "../documents/repositories/document.repository.js";
import { AppError } from "../shared/errors/app-error.js";
import { logger } from "../shared/logger/logger.js";
import { askHandler } from "./handlers/ask.handler.js";
import { deleteHandler } from "./handlers/delete.handler.js";
import { helpHandler } from "./handlers/help.handler.js";
import { listHandler } from "./handlers/list.handler.js";
import { startHandler } from "./handlers/start.handler.js";
import { summaryHandler } from "./handlers/summary.handler.js";
import { uploadHandler } from "./handlers/upload.handler.js";
import { env } from "../config/env.js";

/** Safely reads text from a Telegram message payload. */
function readText(message?: { text?: string }) {
  return message?.text?.trim() ?? "";
}

/** Sends a voice payload to the OpenAI transcription endpoint and returns plain text. */
async function transcribeAudioBuffer(buffer: Buffer, filename = "voice.ogg") {
  const form = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: "audio/ogg" });
  form.append("file", blob, filename);
  form.append("model", env.OPENAI_TRANSCRIBE_MODEL);
  form.append("response_format", "verbose_json");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`STT request failed (${response.status})`);
  }

  const data = (await response.json()) as { text?: string };
  return (data.text || "").trim();
}

/** Builds use-case instances and shares a single repository between them. */
async function createDependencies() {
  const db = await getDb();
  const repository = new DocumentRepository(db);

  return {
    ingestDocumentUseCase: new IngestDocumentUseCase(repository),
    answerQuestionUseCase: new AnswerQuestionUseCase(),
    listDocumentsUseCase: new ListDocumentsUseCase(repository),
    deleteDocumentUseCase: new DeleteDocumentUseCase(repository),
    summarizeDocumentUseCase: new SummarizeDocumentUseCase(repository),
  };
}

/** Wires Telegram commands and message handlers to the application use cases. */
export async function registerHandlers(bot: Telegraf<Context>) {
  const deps = await createDependencies();

  /** Wraps handlers to convert internal errors into user-facing replies. */
  const safe = (handler: (ctx: Context) => Promise<unknown>) => async (ctx: Context) => {
    try {
      await handler(ctx);
    } catch (error) {
      logger.error("Bot handler failed", error);

      if (error instanceof AppError) {
        await ctx.reply(error.message);
        return;
      }

      await ctx.reply("Something went wrong while processing your request.");
    }
  };

  bot.start(safe(startHandler));
  bot.command("help", safe(helpHandler));
  bot.command("list", safe((ctx) => listHandler(ctx, deps.listDocumentsUseCase)));
  bot.command(
    "delete",
    safe((ctx) =>
      deleteHandler(
        ctx,
        deps.deleteDocumentUseCase,
        readText(ctx.message as { text?: string }).replace(/^\/delete\s*/i, ""),
      )),
  );
  bot.command(
    "summary",
    safe((ctx) =>
      summaryHandler(
        ctx,
        deps.summarizeDocumentUseCase,
        readText(ctx.message as { text?: string }).replace(/^\/summary\s*/i, ""),
      )),
  );
  bot.command(
    "ask",
    safe((ctx) =>
      askHandler(
        ctx,
        deps.answerQuestionUseCase,
        readText(ctx.message as { text?: string }).replace(/^\/ask\s*/i, ""),
      )),
  );

  bot.on("document", safe((ctx) => uploadHandler(ctx as never, deps.ingestDocumentUseCase)));

  bot.on("voice", safe(async (ctx) => {
    const voice = (ctx.message as { voice?: { file_id: string } } | undefined)?.voice;
    if (!voice?.file_id) {
      await ctx.reply("Voice payload is missing.");
      return;
    }

    const fileLink = await ctx.telegram.getFileLink(voice.file_id);
    const response = await fetch(fileLink.href);
    const buffer = Buffer.from(await response.arrayBuffer());
    const transcript = await transcribeAudioBuffer(buffer);

    if (!transcript) {
      await ctx.reply("Could not transcribe the voice message.");
      return;
    }

    await askHandler(ctx, deps.answerQuestionUseCase, transcript);
  }));

  bot.on("text", safe(async (ctx) => {
    const text = (ctx.message as { text?: string } | undefined)?.text?.trim();
    if (!text) {
      return;
    }

    if (text.startsWith("/")) {
      return;
    }

    await askHandler(ctx, deps.answerQuestionUseCase, text);
  }));
}
