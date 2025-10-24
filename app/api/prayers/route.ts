import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  const { userId } = await requireAuth();
  const { rows } = await query(
    `SELECT id, title, text, tags, language, category, is_favorite, created_at, updated_at
     FROM prayers WHERE user_id=$1 ORDER BY created_at DESC`,
    [userId]
  );
  return NextResponse.json({ prayers: rows });
}

export async function POST(req: Request) {
  const { userId } = await requireAuth();
  const body = await req.json();
  const id = crypto.randomUUID();
  await query(
    `INSERT INTO prayers (id, user_id, title, text, tags, language, category, is_favorite)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [id, userId, body.title, body.text, body.tags || [], body.language || null, body.category || null, !!body.is_favorite]
  );
  return NextResponse.json({ id });
}

export async function PUT(req: Request) {
  const { userId } = await requireAuth();
  const body = await req.json();
  await query(
    `UPDATE prayers SET title=$1, text=$2, tags=$3, language=$4, category=$5, is_favorite=$6, updated_at=NOW()
     WHERE id=$7 AND user_id=$8`,
    [body.title, body.text, body.tags || [], body.language || null, body.category || null, !!body.is_favorite, body.id, userId]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { userId } = await requireAuth();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await query(`DELETE FROM prayers WHERE id=$1 AND user_id=$2`, [id, userId]);
  return NextResponse.json({ ok: true });
}


