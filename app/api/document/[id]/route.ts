import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  const { rows } = await query(
    `SELECT id, title, filename, status, summary_short, summary_long, questions, created_at FROM documents WHERE id = $1`,
    [id]
  );
  const doc = rows[0] ?? null;
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(doc);
}


