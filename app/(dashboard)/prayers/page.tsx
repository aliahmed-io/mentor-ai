"use client";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, HeartOff, Search, Plus, Trash2, Pencil } from "lucide-react";

type Prayer = {
  id: string;
  title: string;
  text: string;
  tags: string[];
  language?: string | null;
  category?: string | null;
  is_favorite: boolean;
  created_at: string;
};

export default function PrayersPage() {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ title: "", text: "", tags: "", is_favorite: false });
  const [editing, setEditing] = useState<string | null>(null);
  const [edit, setEdit] = useState({ title: "", text: "", tags: "", is_favorite: false });

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/prayers");
      if (res.ok) {
        const json = await res.json();
        setPrayers(json.prayers || []);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    return prayers.filter((p) => p.title.toLowerCase().includes(term) || p.text.toLowerCase().includes(term) || p.tags.join(" ").toLowerCase().includes(term));
  }, [q, prayers]);

  const addPrayer = async () => {
    const body = { title: form.title.trim(), text: form.text.trim(), tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean), is_favorite: form.is_favorite };
    if (!body.title || !body.text) return;
    const res = await fetch("/api/prayers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json();
    setPrayers([{ id: json.id, created_at: new Date().toISOString(), language: null, category: null, ...body }, ...prayers]);
    setForm({ title: "", text: "", tags: "", is_favorite: false });
  };

  const saveEdit = async (id: string) => {
    const body = { ...edit, tags: edit.tags.split(",").map((t) => t.trim()).filter(Boolean), id } as any;
    await fetch("/api/prayers", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setPrayers(prayers.map((x) => (x.id === id ? { ...x, title: edit.title, text: edit.text, tags: body.tags, is_favorite: edit.is_favorite } : x)));
    setEditing(null);
  };

  const toggleFav = async (id: string, isFav: boolean) => {
    const p = prayers.find((x) => x.id === id);
    if (!p) return;
    await fetch("/api/prayers", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...p, is_favorite: !isFav }) });
    setPrayers(prayers.map((x) => (x.id === id ? { ...x, is_favorite: !isFav } : x)));
  };

  const remove = async (id: string) => {
    await fetch(`/api/prayers?id=${id}`, { method: "DELETE" });
    setPrayers(prayers.filter((x) => x.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-semibold">Prayers</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={async () => {
            const samples = [
              { title: "Morning Prayer", text: "Start my day with gratitude and clarity.", tags: ["morning","gratitude"], is_favorite: true },
              { title: "Focus Prayer", text: "Guide me to concentrate and learn effectively.", tags: ["study","focus"], is_favorite: false },
            ];
            for (const s of samples) {
              const res = await fetch("/api/prayers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
              const json = await res.json().catch(() => ({}));
              setPrayers((p) => [{ id: json.id || crypto.randomUUID(), created_at: new Date().toISOString(), language: null, category: null, ...s }, ...p]);
            }
          }}>Add Samples</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardContent className="space-y-3 p-4">
            <h3 className="font-medium">Add new prayer</h3>
            <Input placeholder="Title" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} />
            <textarea placeholder="Prayer text" rows={6} className="w-full border rounded-md p-2 text-sm" value={form.text} onChange={(e) => setForm((s) => ({ ...s, text: e.target.value }))} />
            <Input placeholder="Tags (comma separated)" value={form.tags} onChange={(e) => setForm((s) => ({ ...s, tags: e.target.value }))} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_favorite} onChange={(e) => setForm((s) => ({ ...s, is_favorite: e.target.checked }))} /> Favorite
            </label>
            <Button onClick={addPrayer} className="inline-flex items-center gap-2 text-sm"><Plus className="h-4 w-4" /> Save</Button>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="grid gap-3">
            {filtered.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    {editing === p.id ? (
                      <Input value={edit.title} onChange={(e) => setEdit((s) => ({ ...s, title: e.target.value }))} />
                    ) : (
                      <h4 className="font-medium">{p.title}</h4>
                    )}
                    <div className="flex items-center gap-2">
                      <button aria-label={p.is_favorite ? "Remove from favorites" : "Add to favorites"} onClick={() => toggleFav(p.id, p.is_favorite)} className="text-red-600">
                        {p.is_favorite ? <Heart className="h-4 w-4 fill-red-600" /> : <HeartOff className="h-4 w-4" />}
                      </button>
                      {editing === p.id ? (
                        <Button size="sm" onClick={() => saveEdit(p.id)}>Save</Button>
                      ) : (
                        <button aria-label="Edit prayer" onClick={() => { setEditing(p.id); setEdit({ title: p.title, text: p.text, tags: p.tags.join(", "), is_favorite: p.is_favorite }); }} className="text-gray-600 hover:text-gray-800"><Pencil className="h-4 w-4" /></button>
                      )}
                      <button aria-label="Delete prayer" onClick={() => remove(p.id)} className="text-gray-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  {editing === p.id ? (
                    <textarea rows={4} aria-label="Prayer text" className="w-full border rounded-md p-2 text-sm" value={edit.text} onChange={(e) => setEdit((s) => ({ ...s, text: e.target.value }))} />
                  ) : (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{p.text}</p>
                  )}
                  {p.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {(editing === p.id ? edit.tags.split(",").map((t) => t.trim()).filter(Boolean) : p.tags).map((t) => (
                        <span key={t} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">#{t}</span>
                      ))}
                    </div>
                  )}
                  {editing === p.id && (
                    <Input placeholder="Tags (comma separated)" value={edit.tags} onChange={(e) => setEdit((s) => ({ ...s, tags: e.target.value }))} />
                  )}
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && <p className="text-sm text-muted-foreground">No prayers yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}


