import * as pdf from "pdf-parse";

export async function extractPdf(buffer: Buffer): Promise<{ text: string; numPages: number }> {
  const data = await (pdf as any)(buffer);
  const cleaned = cleanText(data.text || "");
  return { text: cleaned, numPages: data.numpages || 0 };
}

export function cleanText(input: string): string {
  const noHeaders = input.replace(/\n\s*\d+\s*\n/g, "\n");
  const normalized = noHeaders.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return normalized;
}


