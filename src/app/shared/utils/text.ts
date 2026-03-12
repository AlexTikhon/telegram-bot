/** Removes null bytes and normalizes whitespace in extracted text. */
export function cleanText(input: string) {
  return input.replace(/\u0000/g, "").replace(/\s+/g, " ").trim();
}

/** Truncates text to a fixed length while reserving space for an ellipsis. */
export function truncateText(input: string, maxLength: number) {
  if (input.length <= maxLength) {
    return input;
  }

  return `${input.slice(0, maxLength - 3).trim()}...`;
}
