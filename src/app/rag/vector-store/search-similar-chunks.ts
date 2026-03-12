import { MIN_SIMILARITY_SCORE, RETRIEVAL_TOP_K } from "../../config/constants.js";
import { createEmbeddingsModel } from "../../llm/create-embeddings-model.js";
import type { StoredChunkRecord } from "../../documents/types/document.types.js";
import type { RetrievedChunk } from "../types/rag.types.js";
import { createVectorStore } from "./create-vector-store.js";

/** Computes cosine similarity between two embedding vectors. */
function cosineSimilarity(left: number[], right: number[]) {
	let dot = 0;
	let leftNorm = 0;
	let rightNorm = 0;

	for (let i = 0; i < left.length; i += 1) {
		dot += left[i] * right[i];
		leftNorm += left[i] ** 2;
		rightNorm += right[i] ** 2;
	}

	return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

/** Ranks stored chunks by similarity to the question embedding. */
export async function searchSimilarChunks(params: {
	userId: string;
	question: string;
	topK?: number;
	documentId?: string;
}): Promise<RetrievedChunk[]> {
	const repository = await createVectorStore();
	const queryEmbedding = await createEmbeddingsModel().embedQuery(params.question);
	const chunks = repository.listChunksByUser(params.userId, params.documentId);

	return chunks
		.map((chunk: StoredChunkRecord) => ({
			id: chunk.id,
			documentId: chunk.documentId,
			content: chunk.content,
			sourceLabel: chunk.sourceLabel,
			score: cosineSimilarity(queryEmbedding, chunk.embedding),
		}))
		.filter((chunk: RetrievedChunk) => Number.isFinite(chunk.score) && chunk.score >= MIN_SIMILARITY_SCORE)
		.sort((left: RetrievedChunk, right: RetrievedChunk) => right.score - left.score)
		.slice(0, params.topK ?? RETRIEVAL_TOP_K);
}
