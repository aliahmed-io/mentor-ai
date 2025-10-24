import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex flex-1 flex-col items-center justify-center p-10 gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Mentor AI</h1>
        <p className="text-muted-foreground max-w-2xl">
          Smart Study Partner — upload lecture notes and papers, get concise summaries, exam-style
          questions, and ask context-aware questions.
        </p>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/sign-up">Get started</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
