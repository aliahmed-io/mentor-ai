import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";
import { Document, Packer, Paragraph, HeadingLevel } from "docx";
import { uploadToStorage } from "@/lib/storage";

export async function POST(req: Request) {
  const { userId } = await requireAuth();
  const { title, sections } = await req.json();

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: title || "Mentor Essay", heading: HeadingLevel.TITLE }),
          ...(Array.isArray(sections) ? sections : []).flatMap((s: any) => [
            new Paragraph({ text: s.heading || "Section", heading: HeadingLevel.HEADING_2 }),
            ...String(s.content || "").split("\n\n").map((p: string) => new Paragraph(p)),
          ]),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const fileName = `creations/${userId}/${Date.now()}.docx`;
  const { url } = await uploadToStorage(buffer, fileName, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

  const creationId = crypto.randomUUID();
  await query(`INSERT INTO creations (id, user_id, type, title, prompt, status) VALUES ($1,$2,'docx',$3,$4,'processing')`, [creationId, userId, title, JSON.stringify(sections)]);
  await query(`INSERT INTO jobs (id, type, payload) VALUES ($1,'create_docx',$2)`, [crypto.randomUUID(), JSON.stringify({ userId, creationId, url })]);
  return NextResponse.json({ id: creationId, status: 'processing' });
}


