"use client";
import { useEffect, useRef, useState } from "react";
import { Sparkles, BookOpen } from "lucide-react";
import { toast } from "sonner";

export function SelectionToolbar() {
  const [visible, setVisible] = useState(false);
  const [rect, setRect] = useState<{ x: number; y: number } | null>(null);
  const [snippet, setSnippet] = useState("");
  const [documentId, setDocumentId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouseUp = () => {
      const sel = window.getSelection?.()?.toString() || "";
      if (sel.trim().length > 0) {
        const range = window.getSelection()?.getRangeAt(0);
        if (range) {
          const r = range.getBoundingClientRect();
          setRect({ x: r.left + r.width / 2, y: r.top - 8 + window.scrollY });
          setSnippet(sel.trim());
          setVisible(true);
        }
      } else {
        setVisible(false);
      }
    };
    const onScrollOrResize = () => setVisible(false);
    document.addEventListener("mouseup", onMouseUp);
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => document.removeEventListener("mouseup", onMouseUp);
  }, []);

  useEffect(() => {
    try {
      const last = localStorage.getItem("chat_doc_id");
      if (last) setDocumentId(last);
    } catch {}
  }, []);

  if (!visible || !rect) return null;

  const doExplain = async () => {
    try {
      const res = await fetch("/api/ai/explain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: snippet }) });
      if (!res.ok) throw new Error("Explain failed");
      const json = await res.json().catch(() => ({}));
      toast("Explanation", { description: json.explanation || "No explanation" });
    } catch (e) {
      toast("Explain error", { description: e instanceof Error ? e.message : "Failed" });
    }
  };
  const doSources = async () => {
    try {
      const res = await fetch("/api/ai/sources", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: snippet, documentId }) });
      if (!res.ok) throw new Error("Sources failed");
      const json = await res.json().catch(() => ({}));
      const txt = (json.items || []).map((i: any, idx: number) => `${idx + 1}. pos ${i.position} — ${i.preview}`).join("\n\n");
      toast("Sources", { description: txt || "No sources found" });
    } catch (e) {
      toast("Sources error", { description: e instanceof Error ? e.message : "Failed" });
    }
  };

  return (
    <div
      ref={ref}
      className="fixed z-50 translate-x-[-50%] rounded-lg px-2 py-1 flex items-center gap-1 border border-neutral-300 bg-white text-neutral-800 shadow-lg backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
      style={{ left: rect.x, top: rect.y -30 }}
    >
      <button onClick={doExplain} className="px-2 py-1 text-sm rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1">
        <Sparkles className="h-4 w-4 opacity-80" /> Explain
      </button>
      <button onClick={doSources} className="px-2 py-1 text-sm rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1">
        <BookOpen className="h-4 w-4 opacity-80" /> Sources
      </button>
    </div>
  );
}


