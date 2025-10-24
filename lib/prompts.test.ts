import { SUMMARY_SHORT_PROMPT, SUMMARY_LONG_PROMPT } from "./prompts";

test("short prompt contains placeholder", () => {
  expect(SUMMARY_SHORT_PROMPT).toContain("[DOCUMENT_CHUNK]");
});

test("long prompt contains placeholder", () => {
  expect(SUMMARY_LONG_PROMPT).toContain("[DOCUMENT_TEXT]");
});


