import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const { userId } = await requireAuth();
  const { rows } = await query(
    `SELECT q.id, q.title, q.document_id, q.created_at, count(qq.id) as question_count
     FROM quizzes q LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
     WHERE q.user_id=$1 GROUP BY q.id ORDER BY q.created_at DESC`,
    [userId]
  );
  return NextResponse.json({ quizzes: rows });
}

export async function POST(req: Request) {
  const { userId } = await requireAuth();
  const body = await req.json();
  const id = crypto.randomUUID();
  await query(`INSERT INTO quizzes (id, user_id, title, document_id) VALUES ($1,$2,$3,$4)`, [id, userId, body.title, body.document_id || null]);
  return NextResponse.json({ id });
}


