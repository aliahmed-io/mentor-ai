"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Question = { id: string; type: 'mcq'|'short'|'flashcard'; prompt: string; data: any };

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null as any;
  }
}

async function fetchQuizzes() {
  const res = await fetch('/api/quizzes', { cache: 'no-store' });
  if (!res.ok) return [] as { id: string; title: string; question_count: number }[];
  const json = await safeJson(res);
  return (json?.quizzes || []) as { id: string; title: string; question_count: number }[];
}

async function fetchQuestions(quizId: string) {
  const res = await fetch(`/api/quizzes/${quizId}/questions`, { cache: 'no-store' });
  if (!res.ok) return [] as Question[];
  const json = await safeJson(res);
  return (json?.questions || []) as Question[];
}

export default function QuizPage() {
  const [quizzes, setQuizzes] = useState<{ id: string; title: string; question_count: number }[]>([]);
  const [docsCount, setDocsCount] = useState<number>(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);

  useEffect(() => { (async () => setQuizzes(await fetchQuizzes()))(); }, []);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/documents`, { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        setDocsCount(Array.isArray(json?.documents) ? json.documents.length : 0);
      } catch {
        setDocsCount(0);
      }
    })();
  }, []);
  useEffect(() => { (async () => { if (selected) setQuestions(await fetchQuestions(selected)); })(); }, [selected]);

  const mcqs = useMemo(() => questions.filter(q => q.type === 'mcq'), [questions]);
  const shorts = useMemo(() => questions.filter(q => q.type === 'short'), [questions]);
  const flashcards = useMemo(() => questions.filter(q => q.type === 'flashcard'), [questions]);

  const startAttempt = async () => {
    if (!selected) return;
    const res = await fetch(`/api/quizzes/${selected}/attempts`, { method: 'POST' });
    const json = await safeJson(res);
    setAttemptId(json?.attemptId || null);
  };

  const submitAnswer = async (qid: string, value: any, correct: boolean) => {
    if (!attemptId) return;
    await fetch(`/api/quizzes/attempts/${attemptId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question_id: qid, answer: value, correct }) });
  };

  const finish = async () => {
    if (!attemptId) return;
    const score = mcqs.reduce((acc, q) => acc + (answers[q.id]?.correct ? 1 : 0), 0);
    await fetch(`/api/quizzes/attempts/${attemptId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ score }) });
    alert(`Finished! Score ${score}/${mcqs.length}`);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl md:text-2xl font-semibold">Quiz Center</h2>
      {quizzes.length === 0 && docsCount === 0 ? (
        <Card>
          <CardContent className="p-6 space-y-3">
            <p className="text-sm text-muted-foreground">Quizzes are created from your uploaded materials on Home.</p>
            <Link href="/dashboard">
              <Button>Go to Home to generate</Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-1.5 ">Upload your material and toggle "Create Quiz", then run.</p>
          </CardContent>
        </Card>
      ) : quizzes.length === 0 && docsCount > 0 ? (
        <Card>
          <CardContent className="p-6 space-y-3">
            <p className="text-sm text-muted-foreground">You have study materials but no quizzes yet.</p>
            <Link href="/dashboard">
              <Button>Enable "Create Quiz" on Home</Button>
            </Link>
            <p className="text-xs text-muted-foreground">Select your document and toggle the Create Quiz option, then run.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-[18rem_1fr] gap-4">
          <Card>
            <CardContent className="p-3 space-y-2">
              <h3 className="font-medium">Your Quizzes</h3>
              {quizzes.map((q) => (
                <button key={q.id} className={`w-full text-left px-3 py-2 rounded-md ${selected===q.id? 'bg-blue-100' : 'hover:bg-gray-50'}`} onClick={() => setSelected(q.id)}>
                  <div className="font-medium">{q.title}</div>
                  <div className="text-xs text-muted-foreground">{q.question_count} questions</div>
                </button>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-4">
            {!selected ? (
              <p className="text-sm text-muted-foreground">Select a quiz to begin.</p>
            ) : (
              <Tabs defaultValue="mcq" className="w-full">
                <TabsList>
                  <TabsTrigger value="mcq">MCQ</TabsTrigger>
                  <TabsTrigger value="flashcard">Flashcards</TabsTrigger>
                  <TabsTrigger value="short">Short Answer</TabsTrigger>
                </TabsList>
                <div className="py-2" />
                <TabsContent value="mcq">
                  {!attemptId ? (
                    <Button onClick={startAttempt}>Start Attempt</Button>
                  ) : (
                    <div className="space-y-3">
                      {mcqs.map((q, idx) => {
                        const options = q.data?.options || [];
                        return (
                          <Card key={q.id}><CardContent className="p-4 space-y-2">
                            <div className="font-medium">{idx+1}. {q.prompt}</div>
                            <div className="grid sm:grid-cols-2 gap-2">
                              {options.map((opt: any, i: number) => {
                                const key = ['A','B','C','D'][i] || String(i+1);
                                const selectedOpt = answers[q.id]?.value === key;
                                const correct = q.data?.correct_option === key;
                                return (
                                  <button key={key} onClick={() => { setAnswers((s) => ({ ...s, [q.id]: { value: key, correct } })); submitAnswer(q.id, key, correct); }} className={`text-left px-3 py-2 rounded border ${selectedOpt ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}>
                                    <span className="font-semibold mr-2">{key}.</span> {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </CardContent></Card>
                        );
                      })}
                      <Button onClick={finish}>Finish</Button>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="flashcard">
                  <div className="grid gap-3">
                    {flashcards.map((f) => (
                      <Card key={f.id}><CardContent className="p-4">
                        <div className="font-medium">{f.data?.front || f.prompt}</div>
                        <div className="text-sm text-muted-foreground mt-2">{f.data?.back}</div>
                      </CardContent></Card>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="short">
                  <div className="space-y-3">
                    {shorts.map((s) => (
                      <Card key={s.id}><CardContent className="p-4 space-y-2">
                        <div className="font-medium">{s.prompt}</div>
                        <textarea className="w-full border rounded p-2 text-sm" rows={3} placeholder="Type your answer..." aria-label="Short answer" onBlur={async (e) => { const value = e.target.value; setAnswers((x) => ({ ...x, [s.id]: { value } })); await submitAnswer(s.id, value, false); }} />
                        {s.data?.model_answer && <div className="text-xs text-muted-foreground">Model answer: {s.data.model_answer}</div>}
                      </CardContent></Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


