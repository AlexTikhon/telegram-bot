import { createChatModel } from "../../llm/create-chat-model.js";
import { SUMMARIZE_DOCUMENT_SYSTEM_PROMPT } from "../prompts/summarize-document.prompt.js";

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

/** Runs the summary prompt against the chat model for a truncated document body. */
export async function summarizeDocumentChain(text: string) {
  const model = createChatModel();
  const response = await model.invoke(
    `${SUMMARIZE_DOCUMENT_SYSTEM_PROMPT}\n\nDocument text:\n${text}`,
  );

  return readTextContent(response.content);
}
