import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { retrieveSimilarChunks } from "@/lib/vector";
import { RAG_QA_PROMPT } from "@/lib/prompts";
import { streamText } from "@/lib/openai";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth();
    const body = await req.json().catch(() => ({} as any));
    const question = (body?.question ?? "").toString();
    const documentId = body?.documentId ? String(body.documentId) : undefined;
    if (!question) return NextResponse.json({ error: "Missing question" }, { status: 400 });

    let ctx: { id: string; text: string; position: number }[] = [];
    let sources = "";

    if (documentId) {
      try {
        ctx = await retrieveSimilarChunks(question, documentId, 5);
        sources = ctx
          .map((c, i) => `SOURCE_${i + 1} (id:${c.id}, pos:${c.position}):\n${c.text.slice(0, 1200)}`)
          .join("\n\n");
      } catch {}
    }

    const userPrompt = RAG_QA_PROMPT.replace("[USER_QUESTION]", question).replace(/\[SOURCE_\d+_TEXT\]/g, "") +
      (sources ? `\n\n${sources}` : "\n\nNo specific document context provided.");

    const systemPrompt = documentId && ctx.length > 0
      ? "You answer using only the provided sources."
      : "You are a helpful study assistant. Answer the question based on your general knowledge.";

    const userMsgId = crypto.randomUUID();
    await query(
      `INSERT INTO chat_messages (id, user_id, document_id, role, content) VALUES ($1,$2,$3,'user',$4)`,
      [userMsgId, userId, documentId ?? null, question]
    );

    let stream: ReadableStream;
    try {
      stream = await streamText(systemPrompt, userPrompt);
    } catch (err: any) {
      return NextResponse.json({ error: "AI backend unavailable", detail: String(err?.message || err) }, { status: 502 });
    }
    const encoder = new TextEncoder();
    let assistantText = "";
    const wrapped = new ReadableStream({
      async start(controller) {
        if (ctx.length > 0) {
          const items = ctx.map((c) => ({ id: c.id, position: c.position, preview: c.text.slice(0, 160) }));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "sources", items })}\n\n`));
        }
        const reader = (stream as any).getReader();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const text = new TextDecoder().decode(value);
          text.split("\n\n").filter(Boolean).forEach((line) => {
            if (!line.startsWith("data:")) return;
            try {
              const payload = JSON.parse(line.slice(5));
              if (payload.type === "token") assistantText += payload.content;
            } catch {}
          });
          controller.enqueue(value);
        }
        const aId = crypto.randomUUID();
        const sourceIds = ctx.map((c) => c.id);
        await query(
          `INSERT INTO chat_messages (id, user_id, document_id, role, content, source_chunk_ids) VALUES ($1,$2,$3,'assistant',$4,$5)`,
          [aId, userId, documentId ?? null, assistantText, sourceIds]
        );
        controller.close();
      },
    });

    return new NextResponse(wrapped, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Chat failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


