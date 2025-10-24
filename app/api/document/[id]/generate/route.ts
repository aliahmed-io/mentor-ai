import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";
import { SUMMARY_SHORT_PROMPT, SUMMARY_LONG_PROMPT, MCQ_GENERATION_PROMPT, SHORT_ANSWER_PROMPT, FLASHCARDS_PROMPT } from "@/lib/prompts";
import { completeJson, completeText } from "@/lib/openai";
import { retrieveSimilarChunks } from "@/lib/vector";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requireAuth();
  const { id } = await params;
  const body = await req.json().catch(() => ({ regenerate: ["summary", "questions"], features: {} }));
  const regenerate: string[] = body.regenerate ?? ["summary", "questions"];
  const features = body.features ?? {};

  const { rows: chunkRows } = await query<{ text: string }>(
    `SELECT text FROM chunks WHERE document_id=$1 ORDER BY position ASC`,
    [id]
  );
  const fullText = chunkRows.map((r) => r.text).join("\n\n").slice(0, 120_000);

  let summaryShort: string | undefined;
  let summaryLong: string | undefined;
  let questions: any | undefined;

  if (regenerate.includes("summary")) {
    summaryShort = await completeText("You are a concise study assistant.", SUMMARY_SHORT_PROMPT.replace("[DOCUMENT_CHUNK]", fullText.slice(0, 8000)));
    summaryLong = await completeText("You are an academic summarizer.", SUMMARY_LONG_PROMPT.replace("[DOCUMENT_TEXT]", fullText));
  }

  if (regenerate.includes("questions")) {
    const mcq = await completeJson("You produce strict JSON.", MCQ_GENERATION_PROMPT.replace("[DOCUMENT_TEXT]", fullText));
    const shortAns = await completeJson("You produce strict JSON.", SHORT_ANSWER_PROMPT + "\n\nDOCUMENT:" + fullText);
    const flash = await completeJson("You produce strict JSON.", FLASHCARDS_PROMPT + "\n\nDOCUMENT:" + fullText);
    questions = { mcq, short: shortAns, flashcards: flash };
  }

  await query(
    `UPDATE documents SET summary_short = COALESCE($1, summary_short), summary_long = COALESCE($2, summary_long), questions = COALESCE($3, questions) WHERE id = $4`,
    [summaryShort, summaryLong, questions, id]
  );

  // Optionally create a quiz when requested
  if (features?.quiz && questions) {
    const quizId = crypto.randomUUID();
    await query(
      `INSERT INTO quizzes (id, user_id, title, document_id) VALUES ($1,$2,$3,$4)`,
      [quizId, userId, `Quiz for ${id}`, id]
    );

    const toArray = (obj: any): any[] => (Array.isArray(obj) ? obj : []);
    const mcqList = toArray(questions.mcq?.questions) || [];
    const shortList = toArray(questions.short?.questions) || [];
    const cardList = toArray(questions.flashcards?.cards) || [];

    // helper to find citations for a prompt
    const findSourceIds = async (prompt: string) => {
      try {
        const chunks = await retrieveSimilarChunks(prompt, id, 3);
        return chunks.map((c) => c.id);
      } catch {
        return [] as string[];
      }
    };

    // insert MCQs
    for (const q of mcqList) {
      const qid = crypto.randomUUID();
      const src = await findSourceIds(q?.question_text || "");
      await query(
        `INSERT INTO quiz_questions (id, quiz_id, type, prompt, data, source_chunk_ids) VALUES ($1,$2,'mcq',$3,$4,$5)`,
        [qid, quizId, q?.question_text || "", JSON.stringify(q || {}), src]
      );
    }
    // insert Short Answer as separate questions
    for (const q of shortList) {
      const qid = crypto.randomUUID();
      const src = await findSourceIds(q?.question_text || "");
      await query(
        `INSERT INTO quiz_questions (id, quiz_id, type, prompt, data, source_chunk_ids) VALUES ($1,$2,'short',$3,$4,$5)`,
        [qid, quizId, q?.question_text || "", JSON.stringify(q || {}), src]
      );
    }
    // insert Flashcards
    for (const f of cardList) {
      const qid = crypto.randomUUID();
      const src = await findSourceIds(`${f?.front || ''} ${f?.back || ''}`);
      await query(
        `INSERT INTO quiz_questions (id, quiz_id, type, prompt, data, source_chunk_ids) VALUES ($1,$2,'flashcard',$3,$4,$5)`,
        [qid, quizId, f?.front || "", JSON.stringify(f || {}), src]
      );
    }
  }

  return NextResponse.json({ summaryShort, summaryLong, questions });
}


