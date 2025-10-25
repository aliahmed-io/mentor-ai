import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "crypto";
import { query } from "@/lib/db";
import { processDocument } from "@/lib/processing";

const f = createUploadthing();

export const ourFileRouter = {
  documentUploader: f({
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "8MB", maxFileCount: 1 },
    "application/msword": { maxFileSize: "8MB", maxFileCount: 1 },
    "text/plain": { maxFileSize: "8MB", maxFileCount: 1 },
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    "application/vnd.ms-powerpoint": { maxFileSize: "8MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const { userId } = await auth();
      if (!userId) throw new Error("Unauthorized");
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const documentId = randomUUID();
      const filename = file.name || file.key.split("/").pop() || "document";
      const fileUrl = file.url;
      const fileType = file.type || "application/octet-stream";
      await query(
        `INSERT INTO documents (id, user_id, title, filename, file_path, size_bytes, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [documentId, metadata.userId, filename, filename, fileUrl, file.size, "uploaded"]
      );
      // trigger async processing
      processDocument(documentId, fileUrl, fileType, filename).catch(() => {
        query(`UPDATE documents SET status='failed' WHERE id=$1`, [documentId]).catch(() => {});
      });
      return { documentId, fileUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
