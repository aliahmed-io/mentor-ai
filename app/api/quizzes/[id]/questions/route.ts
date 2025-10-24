import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requireAuth();
  const { id } = await params;
  // verify ownership
  const { rows: quizRows } = await query(`SELECT 1 FROM quizzes WHERE id=$1 AND user_id=$2`, [id, userId]);
  if (quizRows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { rows } = await query(
    `SELECT id, type, prompt, data, source_chunk_ids FROM quiz_questions WHERE quiz_id=$1 ORDER BY created_at ASC`,
    [id]
  );
  return NextResponse.json({ questions: rows });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requireAuth();
  const { id } = await params;
  // verify ownership
  const { rows: quizRows } = await query(`SELECT 1 FROM quizzes WHERE id=$1 AND user_id=$2`, [id, userId]);
  if (quizRows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const body = await req.json();
  const qid = crypto.randomUUID();
  await query(
    `INSERT INTO quiz_questions (id, quiz_id, type, prompt, data) VALUES ($1,$2,$3,$4,$5)`,
    [qid, id, body.type, body.prompt, body.data]
  );
  return NextResponse.json({ id: qid });
}


