import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { model } = await req.json();
    const value = typeof model === 'string' ? model : '';
    const res = NextResponse.json({ ok: true });
    // Persist user preference client-side via cookie (30 days)
    res.headers.set('Set-Cookie', `ai_model=${encodeURIComponent(value)}; Path=/; Max-Age=${60*60*24*30}; SameSite=Lax`);
    return res;
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
}
