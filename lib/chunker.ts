export type Chunk = {
  text: string;
  position: number;
  metadata: { start: number; end: number };
};

export function chunkText(text: string, targetChars = 3200, overlapChars = 800): Chunk[] {
  const chunks: Chunk[] = [];
  let start = 0;
  const len = text.length;
  while (start < len) {
    let end = Math.min(start + targetChars, len);
    // try to end at sentence boundary
    const nextDot = text.lastIndexOf(". ", end);
    if (nextDot > start + targetChars * 0.6) end = nextDot + 1;
    const slice = text.slice(start, end).trim();
    if (slice) {
      chunks.push({ text: slice, position: chunks.length, metadata: { start, end } });
    }
    if (end >= len) break;
    start = Math.max(0, end - overlapChars);
  }
  return chunks;
}


