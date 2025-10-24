'use server'

export async function uploadAndGenerate(formData: FormData) {
  const file = formData.get('file') as File | null;
  if (!file) return;

  const fd = new FormData();
  fd.append('file', file);

  const base = process.env.NEXT_PUBLIC_APP_URL || '';

  const res = await fetch(`${base}/api/upload`, { method: 'POST', body: fd });
  const json = await res.json().catch(() => null as any);

  const features = {
    summary: toBool(formData.get('feature_summary')),
    quiz: toBool(formData.get('feature_quiz')),
    ppt: toBool(formData.get('feature_ppt')),
    docx: toBool(formData.get('feature_docx')),
  };

  if (json?.documentId) {
    await fetch(`${base}/api/document/${json.documentId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regenerate: ['summary', 'questions'], features }),
    });
  }
}

function toBool(v: FormDataEntryValue | null) {
  if (typeof v !== 'string') return false;
  return v === 'true' || v === 'on' || v === '1';
}
