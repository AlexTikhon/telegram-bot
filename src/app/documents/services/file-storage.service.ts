import path from "node:path";
import { randomUUID } from "node:crypto";
import { FILES_DIR } from "../../config/constants.js";
import { ensureDir, removeFileIfExists, saveBuffer } from "../../shared/utils/file.js";
import { getFileExtension, getSafeBaseName } from "../../shared/utils/path.js";

/** Stores original uploaded files on disk. */
export class FileStorageService {
  /** Writes the upload to the files directory under a UUID-prefixed safe name. */
  async save(fileName: string, buffer: Buffer) {
    await ensureDir(FILES_DIR);
    const extension = getFileExtension(fileName);
    const storedName = `${randomUUID()}-${getSafeBaseName(fileName) || `document${extension}`}`;
    const fullPath = path.join(FILES_DIR, storedName);

    await saveBuffer(fullPath, buffer);

    return {
      storedName,
      fullPath,
    };
  }

  /** Resolves a stored file name to its absolute path in local storage. */
  getAbsolutePath(storedName: string) {
    return path.join(FILES_DIR, storedName);
  }

  /** Deletes the stored file if it still exists on disk. */
  async delete(storedName: string) {
    await removeFileIfExists(this.getAbsolutePath(storedName));
  }
}
