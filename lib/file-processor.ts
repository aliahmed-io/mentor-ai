import * as pdf from "pdf-parse";
import mammoth from "mammoth";

export interface ProcessedFile {
  text: string;
  numPages?: number;
  fileType: string;
}

export async function processFile(buffer: Buffer, fileType: string, filename: string): Promise<ProcessedFile> {
  switch (fileType) {
    case "application/pdf":
      return await processPdf(buffer);
    
    case "text/plain":
      return await processText(buffer);
    
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "application/msword":
      return await processDocx(buffer);
    
    case "image/jpeg":
    case "image/png":
    case "image/gif":
    case "image/webp":
      return await processImage(buffer, filename);
    
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

async function processPdf(buffer: Buffer): Promise<ProcessedFile> {
  const data = await (pdf as any)(buffer);
  const cleaned = cleanText(data.text || "");
  return {
    text: cleaned,
    numPages: data.numpages || 0,
    fileType: "pdf"
  };
}

async function processText(buffer: Buffer): Promise<ProcessedFile> {
  const text = buffer.toString('utf-8');
  const cleaned = cleanText(text);
  return {
    text: cleaned,
    fileType: "text"
  };
}

async function processDocx(buffer: Buffer): Promise<ProcessedFile> {
  const result = await mammoth.extractRawText({ buffer });
  const cleaned = cleanText(result.value);
  return {
    text: cleaned,
    fileType: "docx"
  };
}

async function processImage(buffer: Buffer, filename: string): Promise<ProcessedFile> {
  // For images, we'll return a placeholder text that indicates it's an image
  // In a real implementation, you'd use OCR (like Tesseract.js) to extract text
  const imageInfo = `[Image file: ${filename}]\n\nThis is an image file. To extract text from images, OCR (Optical Character Recognition) would be needed. For now, this image has been uploaded but no text content can be extracted automatically.`;
  
  return {
    text: imageInfo,
    fileType: "image"
  };
}

function cleanText(input: string): string {
  const noHeaders = input.replace(/\n\s*\d+\s*\n/g, "\n");
  const normalized = noHeaders.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return normalized;
}
