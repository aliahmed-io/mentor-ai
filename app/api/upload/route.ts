import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";
import { randomUUID } from "crypto";
import { uploadToStorage } from "@/lib/storage";
import { processDocument } from "@/lib/processing";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth();
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }
    const allowed = [
      "application/pdf", 
      "text/plain", 
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "image/jpeg",
      "image/png", 
      "image/gif",
      "image/webp"
    ];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const documentId = randomUUID();
    const publicId = `uploads/${userId}/${documentId}/${file.name}`;
    const arrayBuffer = await file.arrayBuffer();
    const uploadResult = await uploadToStorage(Buffer.from(arrayBuffer), publicId, file.type);

    await query(
      `INSERT INTO documents (id, user_id, title, filename, file_path, size_bytes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [documentId, userId, file.name, file.name, uploadResult.url, file.size, "uploaded"]
    );

    // Fire-and-forget processing (no blocking)
    processDocument(documentId, uploadResult.url, file.type, file.name).catch(() => {
      query(`UPDATE documents SET status='failed' WHERE id=$1`, [documentId]).catch(() => {});
    });

    return NextResponse.json({ documentId, status: "processing" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


