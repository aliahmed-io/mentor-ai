"use client";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Clock, CheckCircle, AlertCircle, FileText, Calendar, Search, CheckSquare, FileUp, MessageCircle, GraduationCap, FilePlus2 } from "lucide-react";
import Link from "next/link";

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
  const [loading, setLoading] = useState(true);

  // fetch docs on mount
  useEffect(() => { (async () => { setLoading(true); const d = await getDocs(); setDocs(d); setLoading(false); })(); }, []);
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="space-y-4">
        <div className="rounded-2xl p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow">
          <h2 className="text-xl md:text-2xl font-semibold">Unleash Your Study Flow with Mentor</h2>
          <p className="opacity-90 mt-1 text-sm">Choose features you want, then upload files.</p>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { key: 'summary', label: 'Summarize', icon: MessageCircle },
              { key: 'quiz', label: 'Quiz', icon: GraduationCap },
              { key: 'ppt', label: 'PPT Slides', icon: FilePlus2 },
              { key: 'docx', label: 'Essay Docx', icon: FileText },
            ].map((f) => {
              const Icon = f.icon as any;
              const active = (features as any)[f.key];
              return (
                <button
                  key={f.key}
                  onClick={() => setFeatures((s) => ({ ...s, [f.key]: !active }))}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition border ${active ? 'bg-white text-blue-700' : 'bg-white/10 border-white/30'}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>
          <form action={async (formData: FormData) => {
            "use server";
            const file = formData.get("file") as File | null;
            if (!file) return;
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/upload`, { method: "POST", body: fd });
            const json = await res.json();
            if (json?.documentId) {
              await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/document/${json.documentId}/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ regenerate: ["summary","questions"], features }),
              });
            }
          }} className="mt-4">
            <input type="file" name="file" className="block w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white file:text-blue-700 file:font-medium" />
            <p className="text-xs mt-1 opacity-90">PDF, DOCX, TXT, images supported</p>
            <button className="mt-3 bg-white text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50 transition inline-flex items-center gap-2">
              <FileUp className="h-4 w-4" /> Upload & Run
            </button>
          </form>
        </div>
      </div>
      
      {!loading && docs.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search documents..." 
              className="pl-10 w-full"
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
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            {docs.length} document{docs.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
      
      <div className="grid gap-4">
        {loading ? (
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_,i) => (
              <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Upload your first document to get started with AI-powered summaries and questions.
              </p>
              <Link href="/upload">
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Upload Document
                </button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          docs.map((doc) => (
            <Card key={doc.id} className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-0 shadow-sm" data-document-title={doc.title}>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(doc.status)}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-base md:text-lg truncate">{doc.title}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">{doc.filename}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <Badge className={`${getStatusColor(doc.status)} text-xs`}>
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(doc.created_at)}
                    </div>
                  </div>
                </div>
                
                {doc.summary_short && (
                  <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mb-4">
                    {doc.summary_short}
                  </p>
                )}
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground">
                    {doc.status === 'processing' && 'Processing your document...'}
                    {doc.status === 'uploaded' && 'Document uploaded, processing will begin shortly...'}
                    {doc.status === 'indexed' && 'Ready for AI chat and analysis'}
                    {doc.status === 'failed' && 'Processing failed, please try uploading again'}
                  </div>
                  <Link href={`/document/${doc.id}`}>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200 hover:underline">
                      View Document →
                    </button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}


