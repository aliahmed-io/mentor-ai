"use client";
import { useEffect, useRef, useState } from "react";
import { Sparkles, BookOpen } from "lucide-react";
import { toast } from "sonner";

export function SelectionToolbar() {
  const [visible, setVisible] = useState(false);
  const [rect, setRect] = useState<{ x: number; y: number } | null>(null);
  const [snippet, setSnippet] = useState("");
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
    document.addEventListener("mouseup", onMouseUp);
    return () => document.removeEventListener("mouseup", onMouseUp);
  }, []);

  if (!visible || !rect) return null;

  const doExplain = async () => {
    const res = await fetch("/api/ai/explain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: snippet }) });
    const json = await res.json().catch(() => ({}));
    toast("Explanation", { description: json.explanation || "No explanation" });
  };
  const doSources = async () => {
    const res = await fetch("/api/ai/sources", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: snippet }) });
    const json = await res.json().catch(() => ({}));
    const txt = (json.items || []).map((i: any, idx: number) => `${idx + 1}. pos ${i.position} — ${i.preview}`).join("\n\n");
    toast("Sources", { description: txt || "No sources found" });
  };

  return (
    <div
      ref={ref}
      className="fixed z-50 translate-x-[-50%] bg-white shadow-lg border rounded-full px-2 py-1 flex items-center gap-1"
      style={{ left: rect.x, top: rect.y }}
    >
      <button onClick={doExplain} className="px-2 py-1 text-sm rounded-full hover:bg-blue-50 flex items-center gap-1">
        <Sparkles className="h-4 w-4 text-blue-600" /> Explain
      </button>
      <button onClick={doSources} className="px-2 py-1 text-sm rounded-full hover:bg-indigo-50 flex items-center gap-1">
        <BookOpen className="h-4 w-4 text-indigo-600" /> Sources
      </button>
    </div>
  );
}


