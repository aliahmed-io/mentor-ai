import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { completeJson } from "@/lib/openai";

export async function POST(req: Request) {
  const { userId } = await requireAuth();
  void userId;
  const { topic, context } = await req.json().catch(() => ({ topic: "", context: "" }));

  const system = `You are an expert instructional designer. Given a topic and optional context, produce a concise slide outline as JSON with the following shape:
  { "title": string, "sections": [{ "heading": string, "bullets": string[] }] }
  - 6 to 10 sections maximum.
  - Bullets should be short and scannable (5-10 words).
  - Do not include any additional fields.`;
  const user = `Topic: ${String(topic || "Untitled").slice(0, 200)}\n\nContext (optional): ${String(context || "").slice(0, 4000)}`;

  const json = (await completeJson(system, user)) as any;
  const title = String(json?.title || topic || "Mentor Slides");
  const outline = Array.isArray(json?.sections) ? json.sections : [];
  return NextResponse.json({ title, outline });
}
