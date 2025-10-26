import mammoth from "mammoth";
// OCR is loaded dynamically to avoid bundling/typing issues when not installed

export interface ProcessedFile {
  text: string;
  numPages?: number;
  fileType: string;
  sections?: { heading: string; start: number; end?: number }[];
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
    case "application/vnd.ms-powerpoint":
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      return await processPptx(buffer, filename);
    
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
  const pdf = await import("pdf-parse");
  const data = await (pdf as any)(buffer);
  const cleaned = cleanText(data.text || "");
  const sections = extractHeadingsFromText(cleaned);
  return { text: cleaned, numPages: data.numpages || 0, fileType: "pdf", sections };
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
  // Use HTML to detect headings
  const htmlRes = await mammoth.convertToHtml({ buffer });
  const html = htmlRes.value as string;
  const { text, sections } = htmlToTextWithSections(html);
  const cleaned = cleanText(text);
  return { text: cleaned, fileType: "docx", sections };
}

async function processImage(buffer: Buffer, filename: string): Promise<ProcessedFile> {
  // Gate OCR by env for performance; default OFF
  if (String(process.env.OCR_IMAGES || '').toLowerCase() !== 'true') {
    return { text: `[Image file: ${filename}]\nOCR disabled.`, fileType: "image" };
  }
  try {
    const Tesseract: any = await import("tesseract.js");
    const { data } = await Tesseract.recognize(buffer, 'eng');
    const ocr = cleanText(data.text || '');
    const sections = extractHeadingsFromText(ocr);
    return { text: ocr || `[Image file: ${filename}]`, fileType: "image", sections };
  } catch {
    const fallback = `[Image file: ${filename}]\nNo OCR text extracted.`;
    return { text: fallback, fileType: "image" };
  }
}

async function processPptx(_buffer: Buffer, filename: string): Promise<ProcessedFile> {
  const text = `[Presentation file: ${filename}]\nText extraction for PPT/PPTX is limited in-app. You can still generate a summary or study doc to convert slides into text.`;
  return { text, fileType: "pptx" };
}

function cleanText(input: string): string {
  const noHeaders = input.replace(/\n\s*\d+\s*\n/g, "\n");
  const normalized = noHeaders.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return normalized;
}

function extractHeadingsFromText(text: string): { heading: string; start: number; end?: number }[] {
  const lines = text.split(/\n/);
  const sections: { heading: string; start: number }[] = [];
  let offset = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    const isHeading = trimmed.length > 0 && trimmed.length < 80 && (/^[A-Z0-9 \-:]+$/.test(trimmed) || /^(#+|\d+\.|[A-Z]\))/i.test(trimmed));
    if (isHeading) {
      sections.push({ heading: trimmed, start: offset });
    }
    offset += line.length + 1;
  }
  return sections;
}

function htmlToTextWithSections(html: string): { text: string; sections: { heading: string; start: number; end?: number }[] } {
  // Rough parse: replace block tags with newlines, capture headings
  const headingRegex = /<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi;
  const placeholders: { marker: string; text: string }[] = [];
  let idx = 0;
  let processed = html.replace(headingRegex, (_m, inner) => {
    const marker = `__HDR_${idx++}__`;
    placeholders.push({ marker, text: stripHtml(inner) });
    return `\n${marker}\n`;
  });
  processed = processed.replace(/<br\s*\/>/gi, "\n").replace(/<p[^>]*>/gi, "\n").replace(/<\/p>/gi, "\n");
  const plain = stripHtml(processed);
  const sections: { heading: string; start: number }[] = [];
  for (const ph of placeholders) {
    const pos = plain.indexOf(ph.marker);
    if (pos >= 0) sections.push({ heading: ph.text, start: pos });
  }
  const text = plain.replace(/__HDR_\d+__/g, "").replace(/\n{3,}/g, "\n\n").trim();
  return { text, sections };
}

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
}
