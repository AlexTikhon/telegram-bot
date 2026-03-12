import fs from "node:fs/promises";

/** Ensures that a directory exists before writing files into it. */
export async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

/** Writes a binary buffer to the target path. */
export async function saveBuffer(filePath: string, buffer: Buffer) {
  await fs.writeFile(filePath, buffer);
}

/** Deletes a file and silently ignores a missing-path case. */
export async function removeFileIfExists(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}
