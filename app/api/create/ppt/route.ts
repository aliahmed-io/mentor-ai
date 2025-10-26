import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";
import PptxGenJS from "pptxgenjs";
import { uploadToStorage } from "@/lib/storage";

export async function POST(req: Request) {
  const { userId } = await requireAuth();
  const { title, outline } = await req.json();

  const pptx = new PptxGenJS();
  pptx.title = title || "Mentor Slides";
  const sections: { heading: string; bullets: string[] }[] = outline || [];
  sections.forEach((sec) => {
    const slide = pptx.addSlide();
    slide.addText(sec.heading || "Slide", { x: 0.5, y: 0.4, fontSize: 24, bold: true, color: "203764" });
    (sec.bullets || []).forEach((b, i) => slide.addText(`• ${b}`, { x: 0.7, y: 1.2 + i * 0.5, fontSize: 16 }));
  });

  const arrayBuffer = await pptx.write({ outputType: "arraybuffer" });
  const buffer = Buffer.from(arrayBuffer as ArrayBuffer);
  const creationId = crypto.randomUUID();
  await query(`INSERT INTO creations (id, user_id, type, title, prompt, status) VALUES ($1,$2,'ppt',$3,$4,'processing')`, [creationId, userId, title, JSON.stringify(sections)]);
  await query(`INSERT INTO jobs (id, type, payload) VALUES ($1,'create_ppt',$2)`, [crypto.randomUUID(), JSON.stringify({ userId, creationId, buffer: buffer.toString('base64') })]);
  return NextResponse.json({ id: creationId, status: 'processing' });
}


