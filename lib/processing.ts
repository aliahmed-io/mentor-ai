import { query } from "./db";
import { processFile } from "./file-processor";
import { chunkText } from "./chunker";
import { upsertVectors } from "./vector";

export async function processDocument(documentId: string, fileUrl: string, fileType: string, filename: string) {
  await query(`UPDATE documents SET status = 'processing' WHERE id = $1`, [documentId]);

  // Download file from Uploadthing
  const response = await fetch(fileUrl);
  const buffer = Buffer.from(await response.arrayBuffer());
  
  const { text } = await processFile(buffer, fileType, filename);
  const chunks = chunkText(text);

  // insert chunks
  for (const ch of chunks) {
    const id = crypto.randomUUID();
    await query(
      `INSERT INTO chunks (id, document_id, text, position, metadata) VALUES ($1,$2,$3,$4,$5)`,
      [id, documentId, ch.text, ch.position, ch.metadata]
    );
  }

  // fetch back inserted for upsert to vector
  const { rows } = await query<{ id: string; text: string; position: number }>(
    `SELECT id, text, position FROM chunks WHERE document_id=$1 ORDER BY position ASC`,
    [documentId]
  );
  await upsertVectors(documentId, rows);

  await query(`UPDATE documents SET status = 'indexed' WHERE id = $1`, [documentId]);
}


