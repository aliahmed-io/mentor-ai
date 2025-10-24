import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";
import { Breadcrumb } from "@/components/ui/breadcrumb";

type DocumentRecord = {
  id: string;
  title: string;
  filename: string;
  status: string;
  summary_short: string | null;
  summary_long: string | null;
  questions: unknown | null;
  created_at: string;
};

async function getDoc(id: string): Promise<DocumentRecord | null> {
  const { rows } = await query<DocumentRecord>(
    `SELECT id, title, filename, status, summary_short, summary_long, questions, created_at FROM documents WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await getDoc(id);
  if (!doc) return notFound();
  return (
    <div className="space-y-4 md:space-y-6">
      <Breadcrumb 
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: doc.title }
        ]} 
      />
      <div className="space-y-2">
        <h1 className="text-xl md:text-2xl font-semibold break-words">{doc.title}</h1>
        <p className="text-sm text-muted-foreground">Status: {doc.status}</p>
      </div>
      <form
        action={async () => {
          "use server";
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/document/${doc.id}/generate`, {
            method: "POST",
            body: JSON.stringify({ regenerate: ["summary", "questions"] }),
            headers: { "Content-Type": "application/json" },
          });
          revalidatePath(`/document/${doc.id}`);
        }}
      >
        <Button type="submit" variant="outline">Regenerate summary & questions</Button>
      </form>
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base md:text-lg font-medium">Short Summary</h2>
          {doc.summary_short && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigator.clipboard.writeText(doc.summary_short || '')}
              className="w-full sm:w-auto transition-all duration-200 hover:scale-105"
            >
              Copy
            </Button>
          )}
        </div>
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 md:p-6 border border-gray-200">
          <p className="text-sm md:text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">{doc.summary_short ?? "Generating..."}</p>
        </div>
      </section>
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base md:text-lg font-medium">Detailed Summary</h2>
          {doc.summary_long && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigator.clipboard.writeText(doc.summary_long || '')}
              className="w-full sm:w-auto transition-all duration-200 hover:scale-105"
            >
              Copy
            </Button>
          )}
        </div>
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 md:p-6 border border-gray-200">
          <p className="text-sm md:text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">{doc.summary_long ?? "Generating..."}</p>
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-base md:text-lg font-medium">Questions</h2>
        <div className="bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-200">
          <pre className="text-xs md:text-sm bg-white p-3 rounded-lg overflow-auto max-h-60">{JSON.stringify(doc.questions ?? [], null, 2)}</pre>
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-base md:text-lg font-medium">Ask about this document</h2>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 md:p-6 border border-blue-200">
          <DocChat documentId={doc.id} />
        </div>
      </section>
    </div>
  );
}

function DocChat({ documentId }: { documentId: string }) {
  return (
    <div className="space-y-3">
      {/* Delegates to global chat endpoint with documentId */}
      <form
        action={async (formData: FormData) => {
          "use server";
          const q = String(formData.get("q") || "");
          await fetch(`/api/chat`, { method: "POST", body: JSON.stringify({ question: q, documentId }) });
        }}
        className="space-y-3"
      >
        <input 
          name="q" 
          placeholder="Ask a question about this document..." 
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm md:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
        />
        <button 
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-[1.02] text-sm md:text-base font-medium"
        >
          Ask Question
        </button>
      </form>
      <p className="text-xs text-muted-foreground text-center">
        💡 For real-time chat with streaming responses, visit the Chat page
      </p>
    </div>
  );
}


