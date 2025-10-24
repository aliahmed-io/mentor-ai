import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { completeText } from "@/lib/openai";

export async function POST(req: Request) {
  await requireAuth();
  const { text } = await req.json().catch(() => ({ text: "" }));
  const system = "You are a helpful tutor. Explain the provided text simply in 3-6 sentences.";
  const answer = await completeText(system, String(text || ""));
  return NextResponse.json({ explanation: answer });
}


