import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";
import { SUMMARY_SHORT_PROMPT, SUMMARY_LONG_PROMPT, MCQ_GENERATION_PROMPT, SHORT_ANSWER_PROMPT, FLASHCARDS_PROMPT } from "@/lib/prompts";
import { completeJson, completeText } from "@/lib/openai";
import { retrieveSimilarChunks } from "@/lib/vector";
import PptxGenJS from "pptxgenjs";
import { createPptTheme, addTitleSlide, addSectionDivider, addBulletsSlide } from "@/lib/ppt-theme";
import { uploadToStorage } from "@/lib/storage";
import { processDocument } from "@/lib/processing";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requireAuth();
  const { id } = await params;
  const body = await req.json().catch(() => ({ regenerate: ["summary", "questions"], features: {} }));
  const regenerate: string[] = body.regenerate ?? ["summary", "questions"];
  const features = body.features ?? {};

  // Ensure document is processed (chunks exist). If none, run processing first.
  try {
    const { rows: drows } = await query<{ file_path: string | null; filename: string; status: string }>(
      `SELECT file_path, filename, status FROM documents WHERE id=$1`,
      [id]
    );
    const doc = drows[0];
    const { rows: cntRows } = await query<{ count: number }>(
      `SELECT COUNT(*)::int as count FROM chunks WHERE document_id=$1`,
      [id]
    );
    const hasChunks = (cntRows[0]?.count || 0) > 0;
    if (!hasChunks && doc?.file_path) {
      await processDocument(id, String(doc.file_path), "", doc.filename || "document");
    }
  } catch {}

  const { rows: chunkRows } = await query<{ text: string }>(`SELECT text FROM chunks WHERE document_id=$1 ORDER BY position ASC`, [id]);
  const fullText = chunkRows.map((r) => r.text).join("\n\n").slice(0, 120_000);

  let summaryShort: string | undefined;
  let summaryLong: string | undefined;
  let questions: any | undefined;
  let pptUrl: string | undefined;
  let docUrl: string | undefined;

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

  // Optionally create PPT slides
  if (features?.ppt) {
    try {
      const { rows: drows } = await query<{ title: string | null }>(`SELECT title FROM documents WHERE id=$1`, [id]);
      const baseTitle = drows[0]?.title || "Mentor Slides";
      const outline = (await completeJson("You produce strict JSON.", MCQ_GENERATION_PROMPT.replace("[DOCUMENT_TEXT]", fullText))) as any;
      const sections = Array.isArray(outline?.sections) ? outline.sections : [];
      const title = String(outline?.title || baseTitle);

      const pptx = new PptxGenJS();
      pptx.layout = "LAYOUT_16x9";
      createPptTheme(pptx);

      // Title slide
      addTitleSlide(pptx, title, "Generated by Mentor");

      // Insert a section divider for each section and then a bullets slide
      for (const sec of sections) {
        const heading = String(sec?.heading || "Section");
        addSectionDivider(pptx, heading);
        const bullets = Array.isArray(sec?.bullets) ? sec.bullets : [];
        addBulletsSlide(pptx, heading, bullets);
      }
      const arrayBuffer = await (pptx as any).write("arraybuffer");
      const fileName = `creations/${userId}/${id}-${Date.now()}.pptx`;
      const up = await uploadToStorage(Buffer.from(arrayBuffer as ArrayBuffer), fileName, "application/vnd.openxmlformats-officedocument.presentationml.presentation");
      pptUrl = up.url;
      const cid = crypto.randomUUID();
      await query(`INSERT INTO creations (id, user_id, type, title, prompt, document_id, file_url) VALUES ($1,$2,'ppt',$3,$4,$5,$6)`, [cid, userId, title, JSON.stringify(sections), id, pptUrl]);
    } catch {}
  }

  // Optionally create DOCX long study doc (detailed summarization)
  if (features?.docx) {
    try {
      const { rows: drows } = await query<{ title: string | null }>(`SELECT title FROM documents WHERE id=$1`, [id]);
      const baseTitle = drows[0]?.title || "Mentor Study Doc";
      const sectionsJson = (await completeJson(
        "You are a skilled academic writer. Return JSON only.",
        `Produce an essay outline from the document with sections. JSON: { "title": string, "sections": [{ "heading": string, "content": string }] }. Ensure coherent flow. TEXT:\n${fullText}`
      )) as any;
      const title = String(sectionsJson?.title || baseTitle);
      const sections = Array.isArray(sectionsJson?.sections) ? sectionsJson.sections : [];
      // Build DOCX buffer via dynamic import to avoid ESM issues in some environments
      const { Document, Packer, Paragraph, HeadingLevel } = await import("docx");
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({ text: title, heading: HeadingLevel.TITLE }),
              ...sections.flatMap((s: any) => [
                new Paragraph({ text: s.heading || "Section", heading: HeadingLevel.HEADING_2 }),
                ...String(s.content || "").split("\n\n").map((p: string) => new Paragraph(p)),
              ]),
            ],
          },
        ],
      });
      const buffer = await Packer.toBuffer(doc);
      const fileName = `creations/${userId}/${id}-${Date.now()}.docx`;
      const up = await uploadToStorage(buffer, fileName, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      docUrl = up.url;
      const cid = crypto.randomUUID();
      await query(`INSERT INTO creations (id, user_id, type, title, prompt, document_id, file_url) VALUES ($1,$2,'docx',$3,$4,$5,$6)`, [cid, userId, title, JSON.stringify(sections), id, docUrl]);
    } catch {}
  }

  return NextResponse.json({ summaryShort, summaryLong, questions, pptUrl, docUrl });
}


