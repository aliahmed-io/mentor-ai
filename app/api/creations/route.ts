import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const { userId } = await requireAuth();
  const { rows } = await query(
    `SELECT id, type, title, file_url, status, created_at, document_id FROM creations WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20`,
    [userId]
  );
  const creations = rows.map((r: any) => {
    let inferred_document_id: string | null = null;
    try {
      const url = new URL(r.file_url);
      const name = url.pathname.split('/').pop() || '';
      const docId = name.split('-')[0];
      if (docId && docId.length > 10) inferred_document_id = docId;
    } catch {}
    return { ...r, inferred_document_id };
  });

  // attach document titles for inferred ids
  const ids = Array.from(new Set(creations.map((c: any) => c.inferred_document_id).filter(Boolean))) as string[];
  let titleMap: Record<string, string> = {};
  if (ids.length > 0) {
    try {
      const res = await query<{ id: string; title: string }>(`SELECT id, title FROM documents WHERE id = ANY($1)`, [ids]);
      titleMap = Object.fromEntries(res.rows.map((r) => [r.id, r.title]));
    } catch {}
  }
  const withTitles = creations.map((c: any) => ({ ...c, document_title: c.inferred_document_id ? (titleMap[c.inferred_document_id] || null) : null }));

  // best-effort backfill of document_id when missing but inferred is present
  const toBackfill = withTitles.filter((c: any) => !c.document_id && c.inferred_document_id);
  if (toBackfill.length > 0) {
    try {
      await Promise.all(
        toBackfill.map((c: any) => query(`UPDATE creations SET document_id=$1 WHERE id=$2 AND user_id=$3`, [c.inferred_document_id, c.id, userId]).catch(() => null))
      );
    } catch {}
  }
  return NextResponse.json({ creations: withTitles });
}
