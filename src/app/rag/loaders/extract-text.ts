import { PDFParse } from "pdf-parse";
import { ValidationError } from "../../shared/errors/validation-error.js";
import { cleanText } from "../../shared/utils/text.js";

/** Extracts plain text from supported upload formats. */
export async function extractText(fileName: string, mimeType: string, buffer: Buffer) {
  if (mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")) {
    const parser = new PDFParse({
      data: new Uint8Array(buffer),
    });
    const parsed = await parser.getText();
    await parser.destroy();
    return cleanText(parsed.text);
  }

  if (
    mimeType.startsWith("text/") ||
    fileName.toLowerCase().endsWith(".md") ||
    fileName.toLowerCase().endsWith(".txt")
  ) {
    return cleanText(buffer.toString("utf-8"));
  }

  throw new ValidationError("Unsupported file type. Use PDF, MD, or TXT.");
}
