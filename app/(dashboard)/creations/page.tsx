"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, ArrowLeft } from "lucide-react";

async function getCreations() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/creations`, { cache: "no-store" });
  if (!res.ok) return [] as any[];
  const json = await res.json();
  return (json.creations || []) as { id: string; type: 'ppt'|'docx'; title: string; file_url: string; status: string; created_at: string; inferred_document_id?: string | null; document_title?: string | null }[];
}

export default function CreationsPage() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof getCreations>>>([]);
  const [filter, setFilter] = useState<'all'|'ppt'|'docx'>('all');
  const [q, setQ] = useState('');
  useEffect(() => { (async () => setItems(await getCreations()))(); }, []);

  const filtered = useMemo(() => {
    const byType = items.filter((i) => filter === 'all' ? true : i.type === filter);
    const term = q.toLowerCase();
    return byType.filter((i) => (i.title || '').toLowerCase().includes(term) || (i.document_title || '').toLowerCase().includes(term));
  }, [items, filter, q]);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copy = async (id: string, url: string) => {
    try { await navigator.clipboard.writeText(url); setCopiedId(id); setTimeout(() => setCopiedId(null), 1200); } catch {}
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">All creations</h2>
      </div>
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-1 text-sm">
          <button className={`px-2 py-1 rounded border ${filter==='all'?'bg-blue-50 border-blue-100 text-black':'hover:bg-gray-50 hover:text-black'}`} onClick={() => setFilter('all')}>All</button>
          <button className={`px-2 py-1 rounded border ${filter==='ppt'?'bg-blue-50 border-blue-100 text-black':'hover:bg-gray-50 hover:text-black'}`} onClick={() => setFilter('ppt')}>PPT</button>
          <button className={`px-2 py-1 rounded border ${filter==='docx'?'bg-blue-50 border-blue-100 text-black':'hover:bg-gray-50 hover:text-black'}`} onClick={() => setFilter('docx')}>DOC</button>
        </div>
        <input className="border rounded px-2 py-1 text-sm " placeholder="Search titles…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="grid gap-3">
        {filtered.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  <Badge className="text-xs">{c.type.toUpperCase()}</Badge>
                  <span className="truncate font-medium">{c.title || (c.type === 'ppt' ? 'Slides' : 'Study Doc')}</span>
                  {c.document_title && <>
                    <span className="text-xs text-muted-foreground">· {c.document_title}</span>
                    {c.inferred_document_id && (
                      <Link href={`/document/${c.inferred_document_id}`} className="text-xs text-blue-700 hover:underline">View document</Link>
                    )}
                  </>}
                </div>
                <div className="text-[11px] text-muted-foreground">{new Date(c.created_at).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-3">
                <a href={c.file_url} target="_blank" className="inline-flex items-center gap-2 text-sm text-blue-700 hover:underline"><Download className="h-4 w-4" /> Download</a>
                <button onClick={() => copy(c.id, c.file_url)} className="text-xs text-gray-700 hover:underline">{copiedId===c.id? 'Copied' : 'Copy link'}</button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card><CardContent className="p-6 text-sm text-muted-foreground">No creations yet.</CardContent></Card>
        )}
      </div>
    </div>
  );
}
