import { answerQuestionChain } from "../rag/chains/answer-question.chain.js";
import { formatContext } from "../rag/retrieval/format-context.js";
import { retrieveContext } from "../rag/retrieval/retrieve-context.js";

/** Answers a user question using the most relevant indexed chunks as context. */
export class AnswerQuestionUseCase {
  /** Retrieves context, runs the answer chain, and returns deduplicated source labels. */
  async execute(params: { userId: string; question: string; documentId?: string }) {
    const chunks = await retrieveContext(params.userId, params.question, params.documentId);

    if (chunks.length === 0) {
      return {
        answer: "I could not confirm the answer from the uploaded documents.",
        sources: [] as string[],
      };
    }

    const answer = await answerQuestionChain(params.question, formatContext(chunks));
    const sources = [...new Set(chunks.map((chunk) => chunk.sourceLabel))];

    return {
      answer,
      sources,
    };
  }
}
