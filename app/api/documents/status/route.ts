import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  const { userId } = await requireAuth();
  const { searchParams } = new URL(req.url);
  const ids = (searchParams.get("ids") || "").split(",").filter(Boolean);
  if (ids.length === 0) return NextResponse.json({ statuses: {} });
  const { rows } = await query<{ id: string; status: string; last_error: string | null }>(
    `SELECT id, status, last_error FROM documents WHERE id = ANY($1) AND user_id=$2`,
    [ids, userId]
  );
  const statuses = Object.fromEntries(rows.map((r) => [r.id, { status: r.status, last_error: r.last_error }]));
  return NextResponse.json({ statuses });
}


