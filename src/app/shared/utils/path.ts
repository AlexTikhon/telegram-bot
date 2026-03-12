import path from "node:path";

/** Returns the lowercase file extension including the leading dot. */
export function getFileExtension(fileName: string) {
  return path.extname(fileName).toLowerCase();
}

/** Sanitizes the file name so it is safe to use on disk. */
export function getSafeBaseName(fileName: string) {
  return path.basename(fileName).replace(/[^\w.\-]+/g, "_");
}
