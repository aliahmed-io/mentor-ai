// Runtime model selection: prefer Gemini via REST if a key exists, otherwise fallback to OpenAI SDK
import OpenAI from "openai";
import { cookies } from "next/headers";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.Gemin_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash"; // configurable, 2.5 when available

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function geminiGenerate(parts: any[], opts?: { mime?: string; temperature?: number; model?: string }) {
  const model = opts?.model || GEMINI_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: opts?.temperature ?? 0.25,
      responseMimeType: opts?.mime || undefined,
    },
  } as any;
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error("Gemini request failed");
  return res.json();
}

export async function embedText(text: string): Promise<number[]> {
  // Keep using OpenAI embeddings unless a Gemini embeddings path is added
  if (!openai.apiKey) return [];
  const res = await openai.embeddings.create({ model: "text-embedding-3-small", input: text });
  return res.data[0].embedding as number[];
}

export async function completeJson(system: string, user: string, opts?: { model?: string }): Promise<unknown> {
  let preferred = opts?.model;
  if (!preferred) {
    try {
      const jar = await (cookies() as any);
      preferred = jar?.get?.("ai_model")?.value;
    } catch {}
  }
  if (GEMINI_API_KEY) {
    try {
      const out = await geminiGenerate([
        { text: `SYSTEM:\n${system}\n` },
        { text: `USER:\n${user}\n` },
      ], { mime: "application/json", temperature: 0.2, model: preferred });
      const text = out?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
      try { return JSON.parse(text); } catch { return {}; }
    } catch {
      // fall through to OpenAI
    }
  }
  // Fallback to OpenAI
  if (!openai.apiKey) return {};
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [ { role: "system", content: system }, { role: "user", content: user } ],
    temperature: 0.3,
  });
  const content = res.choices[0].message?.content ?? "{}";
  try { return JSON.parse(content); } catch { return {}; }
}

export async function completeText(system: string, user: string, opts?: { model?: string }): Promise<string> {
  let preferred = opts?.model;
  if (!preferred) {
    try {
      const jar = await (cookies() as any);
      preferred = jar?.get?.("ai_model")?.value;
    } catch {}
  }
  if (GEMINI_API_KEY) {
    try {
      const out = await geminiGenerate([
        { text: `SYSTEM:\n${system}\n` },
        { text: `USER:\n${user}\n` },
      ], { temperature: 0.2, model: preferred });
      return out?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    } catch {
      // fall through to OpenAI
    }
  }
  if (!openai.apiKey) return "";
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [ { role: "system", content: system }, { role: "user", content: user } ],
    temperature: 0.2,
  });
  return res.choices[0].message?.content ?? "";
}

export async function streamText(system: string, user: string): Promise<ReadableStream> {
  if (GEMINI_API_KEY) {
    // Gemini REST streaming is more involved; fallback to one-shot for now
    const text = await completeText(system, user);
    const encoder = new TextEncoder();
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "token", content: text })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        controller.close();
      }
    });
  }
  if (!openai.apiKey) {
    const encoder = new TextEncoder();
    const text = await completeText(system, user);
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "token", content: text })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        controller.close();
      }
    });
  }
  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    stream: true,
    messages: [ { role: "system", content: system }, { role: "user", content: user } ],
  });
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const token = chunk.choices?.[0]?.delta?.content;
        if (token) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "token", content: token })}\n\n`));
      }
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
      controller.close();
    },
  });
}


