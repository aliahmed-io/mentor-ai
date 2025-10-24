export const SUMMARY_SHORT_PROMPT = `You are a concise study assistant. Summarize the following excerpt into 4–6 bullet points, focusing on the most important facts, definitions, and high-level conclusions. Keep each bullet <= 20 words.

[DOCUMENT_CHUNK]
`;

export const SUMMARY_LONG_PROMPT = `You are an academic summarizer. Read the following document sections and produce a coherent summary of about 250–400 words that a student can read in 2 minutes. Use simple language and include key terms and an ordered list of 5 takeaways at the end.

[DOCUMENT_TEXT]
`;

export const MCQ_GENERATION_PROMPT = `You are a test question generator. Create 5 multiple-choice questions from the following document. For each question provide:
- question_text
- four answer options (labeled A, B, C, D)
- correct_option (A|B|C|D)
- a one-sentence explanation for the correct answer

DOCUMENT: [DOCUMENT_TEXT]
Constraints: questions should focus on important concepts, avoid trivial facts, be answerable from the document text, and vary in difficulty.`;

export const SHORT_ANSWER_PROMPT = `Create 5 short-answer questions from the document that require 1–3 sentence answers. For each question include:
- question_text
- model_answer (1–3 sentences)
- difficulty (easy|medium|hard)`;

export const FLASHCARDS_PROMPT = `Create 8 succinct flashcards capturing key concepts, terms, or formulas from the document.
Return strict JSON with an array named cards, each having:
- front: string (<= 12 words)
- back: string (<= 30 words)`;

export const RAG_QA_PROMPT = `You are a helpful study assistant answering a student's question using only the provided sources. The student question: [USER_QUESTION]

Sources:
[SOURCE_1_TEXT]
[SOURCE_2_TEXT]
...

Instructions:
- Use only information in the sources. If the answer is not in the sources, say: "I can't find that in the provided documents — here's how you can check:" then suggest steps.
- Provide a concise answer (2–6 sentences).
- Add a "Sources" section listing the source IDs and short excerpt locations (e.g., Document X — paragraph 3).
- Add a confidence level: Low/Medium/High and a brief reason for the confidence.`;


