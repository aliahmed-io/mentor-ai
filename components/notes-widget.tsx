"use client";
import { useEffect, useState } from "react";
import { Save, StickyNote } from "lucide-react";

export function NotesWidget() {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    // optimistic load from localStorage then fetch from API
    const cached = localStorage.getItem("mentor_notes");
    if (cached) setValue(cached);
    const cachedOpen = localStorage.getItem("mentor_notes_open");
    if (cachedOpen) setOpen(cachedOpen === "true");
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

  useEffect(() => {
    localStorage.setItem("mentor_notes_open", String(open));
  }, [open]);

  return (
    <div className="fixed right-4 bottom-4 z-50">
      {!open && (
        <button
          aria-label="Open notes"
          onClick={() => setOpen(true)}
          className="h-12 w-12 rounded-full shadow-lg border bg-white text-gray-900 flex items-center justify-center hover:bg-gray-50"
        >
          <StickyNote className="h-5 w-5" />
        </button>
      )}
      {open && (
        <div className="w-72 md:w-80 rounded-xl shadow-lg border bg-white text-foreground">
          <div className="px-3 py-2 border-b flex items-center justify-between bg-linear-to-r from-blue-100 to-indigo-100 rounded-t-xl">
            <span className="text-sm font-medium text-blue-900">Quick Notes</span>
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Save className={`h-4 w-4 ${saving ? 'animate-pulse text-blue-600' : ''}`} />
                {saving ? "Saving..." : "Saved"}
              </div>
              <button aria-label="Close notes" onClick={() => setOpen(false)} className="text-xs text-blue-700 hover:underline">Close</button>
            </div>
          </div>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Jot anything here — persists across pages"
            className="w-full h-36 p-3 text-sm outline-none resize-none rounded-b-xl bg-white text-gray-900 placeholder:text-gray-500"
          />
        </div>
      )}
    </div>
  );
}


