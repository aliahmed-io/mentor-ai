import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "crypto";
import { query } from "@/lib/db";
import { processDocument } from "@/lib/processing";
import { ensureDbUser } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  documentUploader: f({
    pdf: { maxFileSize: "8MB", maxFileCount: 10 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "8MB", maxFileCount: 10 },
    "application/msword": { maxFileSize: "8MB", maxFileCount: 10 },
    "text/plain": { maxFileSize: "8MB", maxFileCount: 10 },
    image: { maxFileSize: "8MB", maxFileCount: 10 },
    "application/vnd.ms-powerpoint": { maxFileSize: "8MB", maxFileCount: 10 },
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": { maxFileSize: "8MB", maxFileCount: 10 },
  })
    .middleware(async () => {
      const { userId } = await auth();
      if (!userId) throw new UploadThingError("Unauthorized");
      try { await ensureDbUser(userId); } catch {}
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const documentId = randomUUID();
      const filename = file.name || file.key.split("/").pop() || "document";
      const fileUrl = file.url;
      const fileType = file.type || "application/octet-stream";
      try {
        if (!metadata?.userId) throw new Error("Unauthorized");
        await query(
          `INSERT INTO documents (id, user_id, title, filename, file_path, size_bytes, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [documentId, metadata.userId, filename, filename, fileUrl, file.size, "uploaded"]
        );
      } catch (err) {
        // Best-effort: don't fail the upload; client can retry generation later
        try { console.error("Upload DB insert failed:", err); } catch {}
      }
      // Defer processing until the user clicks Start
      return { documentId, fileUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
