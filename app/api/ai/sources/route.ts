import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { retrieveSimilarChunks } from "@/lib/vector";

export async function POST(req: Request) {
  await requireAuth();
  const { text, documentId } = await req.json().catch(() => ({ text: "" }));
  const chunks = await retrieveSimilarChunks(String(text || ""), documentId, 5);
  return NextResponse.json({
    items: chunks.map((c) => ({ id: c.id, position: c.position, preview: c.text.slice(0, 180) })),
  });
}


