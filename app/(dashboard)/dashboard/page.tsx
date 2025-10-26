"use client";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, AlertCircle, FileText, Calendar, Search, FileUp, MessageCircle, GraduationCap, FilePlus2, Download, Play } from "lucide-react";
import Link from "next/link";
import { uploadAndGenerate } from "./actions";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

async function getDocs() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/documents`, {
    cache: "no-store",
  });
  if (!res.ok) return [] as any[];
  const json = await res.json();
  return json.documents as { 
    id: string; 
    title: string; 
    status: string; 
    summary_short: string | null;
    created_at: string;
    filename: string;
  }[];
}

async function getCreations() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/creations`, { cache: "no-store" });
  if (!res.ok) return [] as any[];
  const json = await res.json();
  return (json.creations || []) as { id: string; type: 'ppt'|'docx'; title: string; file_url: string; status: string; created_at: string }[];
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'uploaded':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'processing':
      return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
    case 'indexed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <FileText className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'uploaded':
      return 'bg-yellow-100 text-yellow-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'indexed':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export default function DashboardPage() {
  const [features, setFeatures] = useState<{summary:boolean; quiz:boolean; ppt:boolean; docx:boolean}>({ summary: true, quiz: true, ppt: false, docx: false });
  const [docs, setDocs] = useState<Awaited<ReturnType<typeof getDocs>>>([]);
  const [creations, setCreations] = useState<Awaited<ReturnType<typeof getCreations>>>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ id: string; title: string; url: string } | null>(null);
  const lastCountRef = useRef(0);
  const pollTimerRef = useRef<any>(null);
  const uploadBtnRef = useRef<HTMLDivElement | null>(null);

  async function refreshCreations() {
    const c = await getCreations();
    // show toast if there is a new creation
    if (lastCountRef.current && c.length > lastCountRef.current) {
      const newest = c[0];
      setToast({ id: newest.id, title: newest.title || (newest.type === 'ppt' ? 'Slides' : 'Study Doc'), url: newest.file_url });
    }
    lastCountRef.current = c.length;
    setCreations(c);
  }

  async function processQueued(ids: string[]) {
    if (ids.length === 0) return;
    await fetch(`/api/documents/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    });
    // poll statuses until all are indexed/failed (timeout ~60s)
    const start = Date.now();
    while (Date.now() - start < 60000) {
      const res = await fetch(`/api/documents/status?ids=${encodeURIComponent(ids.join(','))}`);
      const json = await res.json().catch(() => ({ statuses: {} }));
      const statuses: Record<string, { status: string; last_error?: string | null }> = json.statuses || {};
      const allDone = ids.every((id) => {
        const st = statuses[id]?.status;
        return st === 'indexed' || st === 'failed';
      });
      if (allDone) break;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  useEffect(() => { (async () => { setLoading(true); const [d, c] = await Promise.all([getDocs(), getCreations()]); setDocs(d); setCreations(c); lastCountRef.current = c.length; setLoading(false); })(); }, []);

  function onSubmitClicked() {
    // Poll for new creations shortly after submit
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    pollTimerRef.current = setTimeout(async () => {
      await refreshCreations();
      pollTimerRef.current = setTimeout(async () => {
        await refreshCreations();
      }, 12000);
    }, 6000);
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-sm  text-gray-100">Upload a file and choose what you want Mentor to do.</p>
      </div>

      <Card className="border bg-white">
        <CardContent className="p-5 md:p-6">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { key: 'quiz', label: 'Create Quiz', icon: GraduationCap },
                { key: 'ppt', label: 'Create PPT Slides', icon: FilePlus2 },
                { key: 'docx', label: 'Create Study Doc', icon: FileText },
              ].map((f) => {
                const Icon = f.icon as any;
                const active = (features as any)[f.key];
                return (
                  <Button
                    key={f.key}
                    type="button"
                    variant={active ? "default" : "outline"}
                    onClick={() => setFeatures((s) => ({ ...s, [f.key]: !active }))}
                    className={`w-full justify-center sm:justify-start gap-2 ${active ? '' : 'bg-white border border-gray-300 text-gray-800 hover:bg-gray-50'}`}
                  >
                    <Icon className="h-4 w-4" /> {f.label}
                  </Button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">Summary will always be generated.</p>

            {/* Generation Button */}
            <div className="flex justify-center pt-2">
              <Button 
                onClick={() => {
                  // This will trigger the generation process
                  const hasFeatures = Object.values(features).some(v => v);
                  if (!hasFeatures) {
                    alert('Please select at least one feature to generate');
                    return;
                  }
                  // Read queued uploads and trigger generation for each
                  let queued: string[] = [];
                  try { queued = JSON.parse(localStorage.getItem('pending_doc_ids') || '[]'); } catch {}
                  if (!queued.length) {
                    // If nothing queued, open upload dialog
                    try { (uploadBtnRef.current?.querySelector('button') as HTMLButtonElement | undefined)?.click?.(); } catch {}
                    return;
                  }
                  (async () => {
                    await processQueued(queued);
                    // move queued docs from 'uploaded' -> 'processing/indexed' via API
                    for (const docId of queued) {
                      try {
                        await fetch(`/api/document/${docId}/generate`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ regenerate: ["summary", "questions"], features }),
                        });
                      } catch {}
                    }
                    try { localStorage.removeItem('pending_doc_ids'); } catch {}
                    await refreshCreations();
                  })();
                }}
                className="bg-black hover:bg-neutral-800 text-white px-6 py-3 h-auto text-sm sm:text-base font-medium"
                disabled={!Object.values(features).some(v => v)}
              >
                <Play className="h-5 w-5 mr-2 " />
                Start Generation 
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <div ref={uploadBtnRef}>
              <UploadButton<OurFileRouter, "documentUploader">
                endpoint="documentUploader"
                onUploadBegin={() => {
                  onSubmitClicked();
                }}
                onClientUploadComplete={async (res) => {
                  // Collect all uploaded document IDs; user will click Start to generate
                  const ids = (res || []).map((r: any) => r?.serverData?.documentId).filter(Boolean) as string[];
                  if (ids.length > 0) {
                    try {
                      const prev = JSON.parse(localStorage.getItem('pending_doc_ids') || '[]');
                      const merged = Array.from(new Set([...(Array.isArray(prev) ? prev : []), ...ids]));
                      localStorage.setItem('pending_doc_ids', JSON.stringify(merged));
                    } catch {}
                  }
                }}
                onUploadError={() => {
                  setToast({ id: "upload_error", title: "Upload failed", url: "" });
                }}
                appearance={{
                  container: "justify-start",
                  button: [
                    "rounded-md border border-neutral-800",
                    "bg-neutral-900 text-white hover:bg-neutral-800",
                    "h-10 px-4 py-2",
                    "shadow-sm",
                  ].join(" "),
                  allowedContent: "text-xs text-muted-foreground",
                }}
              />
              </div>
              <p className="text-xs text-muted-foreground">PDF, DOCX, PPTX, TXT, and images are supported (max 8MB).</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-base font-medium">Recent documents</h3>
          {!loading && (
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9"
                onChange={(e) => {
                  const searchTerm = e.target.value.toLowerCase();
                  const cards = document.querySelectorAll('[data-document-title]');
                  cards.forEach((card) => {
                    const title = card.getAttribute('data-document-title')?.toLowerCase() || '';
                    const element = card as HTMLElement;
                    element.style.display = title.includes(searchTerm) ? 'block' : 'none';
                  });
                }}
              />
            </div>
          )}
        </div>

        <div className="grid gap-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-md bg-muted animate-pulse" />
            ))
          ) : docs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No documents yet. Upload your first document to get started.</p>
              </CardContent>
            </Card>
          ) : (
            docs.map((doc) => {
              const related = creations.filter((c) => c.inferred_document_id === doc.id);
              return (
              <Card key={doc.id} data-document-title={doc.title}>
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(doc.status)}
                        <h4 className="font-medium truncate">{doc.title}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">{doc.filename}</p>
                      {doc.summary_short && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{doc.summary_short}</p>
                      )}
                      {related.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="text-xs font-medium text-muted-foreground">Creations</div>
                          <div className="flex flex-wrap gap-2">
                            {related.map((c) => (
                              <a key={c.id} href={c.file_url} target="_blank" className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded border hover:bg-neutral-50 dark:hover:bg-neutral-800">
                                <Badge className="text-[10px]" variant="secondary">{c.type.toUpperCase()}</Badge>
                                <span className="truncate max-w-48">{c.title || (c.type === 'ppt' ? 'Slides' : 'Study Doc')}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge className={`${getStatusColor(doc.status)} text-xs`}>{doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}</Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" />{formatDate(doc.created_at)}</div>
                      <div className="flex items-center gap-2">
                        <Link href={`/document/${doc.id}`}>
                          <Button variant="link" className="px-0 h-auto text-sm">View →</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );})
          )}
        </div>
      </div>

      {/* Recent creations */}
      {creations.length > 0 && (
        <div className="space-y-3" id="recent-creations">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium">Recent creations</h3>
            <Link href="/creations" className="text-sm text-blue-700 hover:underline">View all</Link>
          </div>
          <div className="grid gap-3">
            {creations.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge className="text-xs">{c.type.toUpperCase()}</Badge>
                      <span className="truncate font-medium">{c.title || (c.type === 'ppt' ? 'Slides' : 'Study Doc')}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{formatDate(c.created_at)}</div>
                  </div>
                  <a href={c.file_url} target="_blank" className="inline-flex items-center gap-2 text-sm text-blue-700 hover:underline"><Download className="h-4 w-4" /> Download</a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 right-4 z-50">
          <div className="rounded-md border bg-white dark:bg-neutral-900 shadow-lg p-3 min-w-[240px]">
            <div className="text-sm font-medium">Created: {toast.title}</div>
            <a href={toast.url} target="_blank" className="text-xs text-neutral-700 dark:text-neutral-300 hover:underline">Download</a>
            <div className="mt-2 flex justify-end">
              <button className="text-xs text-gray-600 hover:underline" onClick={() => setToast(null)}>Dismiss</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


