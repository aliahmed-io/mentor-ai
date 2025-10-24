import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { completeJson } from "@/lib/openai";

export async function POST(req: Request) {
  const { userId } = await requireAuth();
  void userId;
  const { topic, context } = await req.json().catch(() => ({ topic: "", context: "" }));

  const system = `You are a skilled academic writer. Given a topic and optional context, produce an essay outline as JSON with the following shape:
  { "title": string, "sections": [{ "heading": string, "content": string }] }
  - 4 to 8 sections maximum.
  - Each section content should be 2-4 concise paragraphs.
  - Do not include any additional fields.`;
  const user = `Topic: ${String(topic || "Untitled").slice(0, 200)}\n\nContext (optional): ${String(context || "").slice(0, 4000)}`;

  const json = (await completeJson(system, user)) as any;
  const title = String(json?.title || topic || "Mentor Essay");
  const sections = Array.isArray(json?.sections) ? json.sections : [];
  return NextResponse.json({ title, sections });
}
