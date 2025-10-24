import { chunkText } from "./chunker";

test("chunkText creates overlapping chunks", () => {
  const text = "Sentence one. ".repeat(500);
  const chunks = chunkText(text, 500, 100);
  expect(chunks.length).toBeGreaterThan(1);
  expect(chunks[0].text.length).toBeGreaterThan(100);
  expect(chunks[1].metadata.start).toBeLessThan(chunks[1].metadata.end);
});


