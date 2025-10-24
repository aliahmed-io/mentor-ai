import { Index } from "@upstash/vector";
import { embedText } from "./openai";
import { query } from "./db";

const index = Index.fromEnv();

export async function upsertVectors(documentId: string, items: { id: string; text: string; position: number }[]) {
  const vectors = await Promise.all(
    items.map(async (it) => ({ id: it.id, vector: await embedText(it.text), metadata: { documentId, position: it.position, preview: it.text.slice(0, 120) } }))
  );
  await index.upsert(vectors, { namespace: documentId });
}

export async function retrieveSimilarChunks(queryText: string, documentId?: string, topK = 5) {
  const queryVector = await embedText(queryText);
  const res = await index.query({ vector: queryVector, topK, filter: documentId ? `documentId = '${documentId}'` : undefined });
  const ids = res.map((r) => r.id);
  if (ids.length === 0) return [] as { id: string; text: string; position: number }[];
  const rowsRes = await query<{ id: string; text: string; position: number }>(
    `SELECT id, text, position FROM chunks WHERE id = ANY($1) ORDER BY position ASC`,
    [ids]
  );
  return rowsRes.rows;
}


