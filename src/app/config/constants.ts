import path from "node:path";

export const APP_NAME = "ai-knowledge-assistant-tg-bot";
export const DATA_DIR = path.resolve(process.cwd(), "data");
export const FILES_DIR = path.join(DATA_DIR, "files");
export const SQLITE_PATH = path.join(DATA_DIR, "app.db");

export const CHUNK_SIZE = 1000;
export const CHUNK_OVERLAP = 150;
export const RETRIEVAL_TOP_K = 5;
export const MIN_SIMILARITY_SCORE = 0.2;
export const MAX_SUMMARY_SOURCE_CHARS = 12000;
export const SUPPORTED_EXTENSIONS = new Set([".pdf", ".md", ".txt"]);
