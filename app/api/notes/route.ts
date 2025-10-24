import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const { userId } = await requireAuth();
  const { rows } = await query<{ content: string }>(
    `SELECT content FROM notes WHERE user_id=$1 LIMIT 1`,
    [userId]
  );
  return NextResponse.json({ content: rows[0]?.content || "" });
}

export async function PUT(req: Request) {
  const { userId } = await requireAuth();
  const { content } = await req.json().catch(() => ({ content: "" }));
  const id = userId; // single note per user
  await query(
    `INSERT INTO notes (id, user_id, content, updated_at)
     VALUES ($1,$2,$3,NOW())
     ON CONFLICT (id) DO UPDATE SET content=EXCLUDED.content, updated_at=NOW()`,
    [id, userId, String(content || "")]
  );
  return NextResponse.json({ ok: true });
}


