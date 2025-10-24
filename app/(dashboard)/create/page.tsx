"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CreatePage() {
  const [pptOutline, setPptOutline] = useState([{ heading: "Introduction", bullets: ["Key point 1", "Key point 2"] }]);
  const [pptTitle, setPptTitle] = useState("Generated Slides");
  const [docTitle, setDocTitle] = useState("Generated Essay");
  const [docSections, setDocSections] = useState([{ heading: "Overview", content: "Write paragraphs here." }]);
  const [links, setLinks] = useState<{ ppt?: string; doc?: string }>({});

  const createPPT = async () => {
    const res = await fetch('/api/create/ppt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: pptTitle, outline: pptOutline }) });
    const json = await res.json();
    setLinks((s) => ({ ...s, ppt: json.url }));
  };
  const createDoc = async () => {
    const res = await fetch('/api/create/docx', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: docTitle, sections: docSections }) });
    const json = await res.json();
    setLinks((s) => ({ ...s, doc: json.url }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl md:text-2xl font-semibold">Create</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <Card><CardContent className="p-4 space-y-3">
          <h3 className="font-medium">PPT Slides</h3>
          <input className="w-full border rounded p-2 text-sm" value={pptTitle} onChange={(e) => setPptTitle(e.target.value)} />
          <textarea className="w-full border rounded p-2 text-sm" rows={6} value={JSON.stringify(pptOutline, null, 2)} onChange={(e) => setPptOutline(JSON.parse(e.target.value || '[]'))} />
          <Button onClick={createPPT}>Generate PPTX</Button>
          {links.ppt && <a className="text-blue-600 underline block" href={links.ppt} target="_blank">Download PPTX</a>}
        </CardContent></Card>
        <Card><CardContent className="p-4 space-y-3">
          <h3 className="font-medium">Essay Docx</h3>
          <input className="w-full border rounded p-2 text-sm" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} />
          <textarea className="w-full border rounded p-2 text-sm" rows={6} value={JSON.stringify(docSections, null, 2)} onChange={(e) => setDocSections(JSON.parse(e.target.value || '[]'))} />
          <Button onClick={createDoc}>Generate DOCX</Button>
          {links.doc && <a className="text-blue-600 underline block" href={links.doc} target="_blank">Download DOCX</a>}
        </CardContent></Card>
      </div>
    </div>
  );
}


