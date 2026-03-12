# ai-knowledge-assistant-tg-bot

Telegram bot for personal document Q&A with a simple RAG pipeline.

## What it does

1. User uploads `PDF`, `MD`, or `TXT`
2. Bot extracts text
3. Text is split into chunks
4. OpenAI embeddings are generated
5. Chunks and embeddings are stored locally
6. User asks a question
7. Bot retrieves relevant chunks and answers with sources

Voice messages are also supported: the bot transcribes voice to text with OpenAI and treats it as a question.

## Commands

- `/start`
- `/help`
- `/list`
- `/ask <question>`
- `/summary <documentId>`
- `/delete <documentId>`

If the user sends plain text without a command, the bot treats it as a question.

## Stack

- `telegraf`
- `typescript`
- `langchain`
- `@langchain/openai`
- `better-sqlite3`
- `pdf-parse`
- `dotenv`
- `zod`

## Storage

- Files: `data/files`
- Metadata: SQLite `data/app.db`
- Embeddings: stored in SQLite through the `src/app/rag/vector-store` abstraction

This is an embedded MVP storage approach. The vector-store layer is isolated so it can be swapped to Chroma later if needed.

## Run

1. Configure `.env`
   - `TELEGRAM_BOT_TOKEN=...`
   - `OPENAI_API_KEY=...`
   - optional: `OPENAI_CHAT_MODEL=...`
   - optional: `OPENAI_EMBEDDINGS_MODEL=...`
   - optional: `OPENAI_TRANSCRIBE_MODEL=...`
2. Install dependencies:
   - `npm install --legacy-peer-deps`
3. Start:
   - `npm run dev`
   - `npm start`

## Project structure

See `src/app` for the main modules:

- `bot` - Telegraf bot, handlers, UI messages
- `application` - use cases
- `rag` - loading, splitting, embeddings, retrieval, prompts, chains
- `documents` - file storage and metadata services
- `llm` - OpenAI model factories
- `db` - SQLite bootstrap
- `shared` - logger, utils, errors
