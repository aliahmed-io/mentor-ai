"use client";
import { useEffect, useState } from "react";
import { Save } from "lucide-react";

export function NotesWidget() {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // optimistic load from localStorage then fetch from API
    const cached = localStorage.getItem("mentor_notes");
    if (cached) setValue(cached);
    (async () => {
      try {
        const res = await fetch("/api/notes", { method: "GET" });
        if (res.ok) {
          const json = await res.json();
          if (json?.content) setValue(json.content);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem("mentor_notes", value);
    const id = setTimeout(async () => {
      setSaving(true);
      try {
        await fetch("/api/notes", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: value }) });
      } finally {
        setSaving(false);
      }
    }, 800);
    return () => clearTimeout(id);
  }, [value]);

  return (
    <div className="fixed right-4 bottom-4 z-50 w-72 md:w-80">
      <div className="rounded-xl shadow-lg border bg-white">
        <div className="px-3 py-2 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
          <span className="text-sm font-medium text-blue-800">Quick Notes</span>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Save className={`h-4 w-4 ${saving ? 'animate-pulse text-blue-600' : ''}`} />
            {saving ? "Saving..." : "Saved"}
          </div>
        </div>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Jot anything here — persists across pages"
          className="w-full h-36 p-3 text-sm outline-none resize-none rounded-b-xl"
        />
      </div>
    </div>
  );
}


