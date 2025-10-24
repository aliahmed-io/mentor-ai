import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const { userId } = await requireAuth();
  const { attemptId } = await params;
  // ownership: ensure attempt belongs to user
  const { rows: owns } = await query(`SELECT 1 FROM quiz_attempts WHERE id=$1 AND user_id=$2`, [attemptId, userId]);
  if (owns.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const body = await req.json();
  const id = crypto.randomUUID();
  await query(
    `INSERT INTO question_attempts (id, attempt_id, question_id, answer, correct)
     VALUES ($1,$2,$3,$4,$5)`,
    [id, attemptId, body.question_id, body.answer, !!body.correct]
  );
  return NextResponse.json({ id });
}

export async function PUT(req: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const { userId } = await requireAuth();
  const { attemptId } = await params;
  const { rows: owns } = await query(`SELECT 1 FROM quiz_attempts WHERE id=$1 AND user_id=$2`, [attemptId, userId]);
  if (owns.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { score } = await req.json();
  await query(`UPDATE quiz_attempts SET completed_at=NOW(), score=$1 WHERE id=$2 AND user_id=$3`, [score ?? null, attemptId, userId]);
  return NextResponse.json({ ok: true });
}


