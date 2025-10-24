import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  const { userId } = await requireAuth();
  const body = await req.json();
  const id = crypto.randomUUID();
  await query(
    `INSERT INTO pomodoro_sessions (id, user_id, label, duration_min, started_at, completed_at)
     VALUES ($1,$2,$3,$4,$5,NOW())`,
    [id, userId, body.label || null, body.duration_min || 25, body.started_at || new Date().toISOString()]
  );
  return NextResponse.json({ id });
}


