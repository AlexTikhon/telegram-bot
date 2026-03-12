import { createChatModel } from "../../llm/create-chat-model.js";
import { ANSWER_QUESTION_SYSTEM_PROMPT } from "../prompts/answer-question.prompt.js";

/** Normalizes LangChain response content into a plain string. */
function readTextContent(content: unknown) {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === "object" && part && "text" in part ? String(part.text) : ""))
      .join("")
      .trim();
  }

  return "";
}

/** Runs the answer prompt against the chat model with retrieved context. */
export async function answerQuestionChain(question: string, context: string) {
  const model = createChatModel();
  const response = await model.invoke(
    `${ANSWER_QUESTION_SYSTEM_PROMPT}\n\nQuestion:\n${question}\n\nContext:\n${context}`,
  );

  return readTextContent(response.content);
}
