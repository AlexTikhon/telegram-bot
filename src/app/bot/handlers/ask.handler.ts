import type { Context } from "telegraf";
import type { AnswerQuestionUseCase } from "../../application/answer-question.use-case.js";

/** Handles `/ask` and plain-text questions routed through the bot. */
export async function askHandler(
  ctx: Context,
  answerQuestionUseCase: AnswerQuestionUseCase,
  question: string,
) {
  if (!question.trim()) {
    await ctx.reply("Use `/ask <question>` or send plain text.");
    return;
  }

  const result = await answerQuestionUseCase.execute({
    userId: String(ctx.from?.id),
    question,
  });

  const sources =
    result.sources.length > 0
      ? `\n\nSources:\n${result.sources.map((source) => `- ${source}`).join("\n")}`
      : "\n\nSources:\n- none";

  await ctx.reply(`${result.answer}${sources}`);
}
