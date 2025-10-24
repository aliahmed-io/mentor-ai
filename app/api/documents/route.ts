import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const { userId } = await requireAuth();
  const { rows } = await query(
    `SELECT id, title, filename, status, created_at, left(coalesce(summary_short, ''), 120) as summary_short
     FROM documents WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
    [userId]
  );
  return NextResponse.json({ documents: rows });
}


