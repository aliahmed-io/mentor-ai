import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";
import { processDocument } from "@/lib/processing";

export async function POST(req: Request) {
  const { userId } = await requireAuth();
  const { ids } = await req.json().catch(() => ({ ids: [] as string[] }));
  const docIds: string[] = Array.isArray(ids) ? ids : [];
  const results: Record<string, string> = {};
  await Promise.all(
    docIds.map(async (id) => {
      try {
        const { rows } = await query<{ file_path: string | null; filename: string | null }>(
          `SELECT file_path, filename FROM documents WHERE id=$1 AND user_id=$2`,
          [id, userId]
        );
        const doc = rows[0];
        if (!doc?.file_path) {
          results[id] = "missing_file";
          return;
        }
        // mark as processing and run in background, but here we await for simplicity
        await query(`UPDATE documents SET status='processing', processing_started_at=NOW(), processing_attempts=processing_attempts+1, last_error=NULL WHERE id=$1 AND user_id=$2`, [id, userId]);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 60_000);
        try {
          await processDocument(id, String(doc.file_path), "", doc.filename || "document");
          results[id] = "indexed";
        } catch (e: any) {
          await query(`UPDATE documents SET status='failed', last_error=$2 WHERE id=$1`, [id, String(e?.message || "process_failed")]);
          results[id] = "failed";
        } finally {
          clearTimeout(timer);
        }
      } catch (e) {
        results[id] = "error";
      }
    })
  );
  return NextResponse.json({ results });
}


