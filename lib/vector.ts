import { Index } from "@upstash/vector";
import { embedText } from "./openai";
import { query } from "./db";

let index: ReturnType<typeof Index.fromEnv> | null = null;
try {
  index = Index.fromEnv();
} catch {
  index = null;
}

const embedCache = new Map<string, number[]>();

export async function upsertVectors(documentId: string, items: { id: string; text: string; position: number }[]) {
  if (!index) return; // vector disabled if env missing
  const vectors = [] as { id: string; vector: number[]; metadata: Record<string, any> }[];
  for (const it of items) {
    const key = it.text.slice(0, 256); // micro-cache by prefix to avoid huge keys
    let vec = embedCache.get(key);
    if (!vec) {
      vec = await embedText(it.text);
      if (vec && vec.length) embedCache.set(key, vec);
    }
    if (!vec || vec.length === 0) continue;
    vectors.push({ id: it.id, vector: vec, metadata: { documentId, position: it.position, preview: it.text.slice(0, 120) } });
  }
  if (vectors.length === 0) return;
  // chunk uploads to avoid large payloads
  const chunkSize = 50;
  for (let i = 0; i < vectors.length; i += chunkSize) {
    const chunk = vectors.slice(i, i + chunkSize);
    await index.upsert(chunk, { namespace: documentId });
  }
}

export async function retrieveSimilarChunks(queryText: string, documentId?: string, topK = 5) {
  if (!index) return [] as { id: string; text: string; position: number }[];
  const queryVector = await embedText(queryText);
  if (!queryVector || queryVector.length === 0) return [] as { id: string; text: string; position: number }[];
  const res = await index.query({ vector: queryVector, topK, filter: documentId ? `documentId = '${documentId}'` : undefined });
  const ids = res.map((r) => r.id);
  if (ids.length === 0) return [] as { id: string; text: string; position: number }[];
  const rowsRes = await query<{ id: string; text: string; position: number }>(
    `SELECT id, text, position FROM chunks WHERE id = ANY($1) ORDER BY position ASC`,
    [ids]
  );
  return rowsRes.rows;
}


