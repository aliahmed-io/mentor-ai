"use client";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, HeartOff, Search, Plus, Trash2 } from "lucide-react";

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
            <button onClick={addPrayer} className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-md text-sm"><Plus className="h-4 w-4" /> Save</button>
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
                    <h4 className="font-medium">{p.title}</h4>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleFav(p.id, p.is_favorite)} className="text-red-600">
                        {p.is_favorite ? <Heart className="h-4 w-4 fill-red-600" /> : <HeartOff className="h-4 w-4" />}
                      </button>
                      <button onClick={() => remove(p.id)} className="text-gray-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{p.text}</p>
                  {p.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {p.tags.map((t) => (
                        <span key={t} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">#{t}</span>
                      ))}
                    </div>
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


