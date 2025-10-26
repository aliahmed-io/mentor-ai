import { query } from "./db";
import { processFile } from "./file-processor";
import { chunkText } from "./chunker";
import { upsertVectors } from "./vector";

export async function processDocument(documentId: string, fileUrl: string, fileType: string, filename: string) {
  await query(`UPDATE documents SET status = 'processing', processing_started_at = COALESCE(processing_started_at, NOW()) WHERE id = $1`, [documentId]);

  // Download file from Uploadthing
  const response = await fetch(fileUrl);
  const buffer = Buffer.from(await response.arrayBuffer());

  // Resolve content type if not provided or generic
  let resolvedType = fileType;
  if (!resolvedType || resolvedType === "application/octet-stream") {
    const headerType = response.headers.get("content-type") || "";
    resolvedType = headerType.split(";")[0] || guessTypeFromFilename(filename) || "application/octet-stream";
  }

  const { text } = await processFile(buffer, resolvedType, filename);
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

  await query(`UPDATE documents SET status = 'indexed', processing_completed_at = NOW(), last_error=NULL WHERE id = $1`, [documentId]);
}

function guessTypeFromFilename(name: string): string | undefined {
  const n = (name || "").toLowerCase();
  if (n.endsWith('.pdf')) return 'application/pdf';
  if (n.endsWith('.txt')) return 'text/plain';
  if (n.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (n.endsWith('.doc')) return 'application/msword';
  if (n.endsWith('.ppt')) return 'application/vnd.ms-powerpoint';
  if (n.endsWith('.pptx')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'image/jpeg';
  if (n.endsWith('.png')) return 'image/png';
  if (n.endsWith('.gif')) return 'image/gif';
  if (n.endsWith('.webp')) return 'image/webp';
  return undefined;
}


