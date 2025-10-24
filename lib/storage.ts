import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function uploadToStorage(buffer: Buffer, publicId: string, contentType: string): Promise<{ key: string; url: string }> {
  try {
    // Convert Buffer to Uint8Array for File constructor
    const uint8Array = new Uint8Array(buffer);
    const uploadResult = await utapi.uploadFiles(
      new File([uint8Array], publicId, { type: contentType })
    );

    if (!uploadResult || uploadResult.error) {
      throw new Error("Upload failed");
    }

    return {
      key: uploadResult.data.key,
      url: uploadResult.data.url,
    };
  } catch (error) {
    console.error("Upload error:", error);
    throw new Error("Failed to upload file");
  }
}


