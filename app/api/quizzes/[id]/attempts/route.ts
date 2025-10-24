import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requireAuth();
  const { id } = await params;
  // verify ownership
  const { rows: quizRows } = await query(`SELECT 1 FROM quizzes WHERE id=$1 AND user_id=$2`, [id, userId]);
  if (quizRows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const attemptId = crypto.randomUUID();
  await query(`INSERT INTO quiz_attempts (id, quiz_id, user_id, started_at) VALUES ($1,$2,$3,NOW())`, [attemptId, id, userId]);
  return NextResponse.json({ attemptId });
}


