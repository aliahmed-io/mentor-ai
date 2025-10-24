import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const { userId } = await requireAuth();
  const { rows } = await query(
    `SELECT id, type, title, file_url, status, created_at FROM creations WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20`,
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
  return NextResponse.json({ creations: withTitles });
}
