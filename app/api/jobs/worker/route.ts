import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { uploadToStorage } from "@/lib/storage";

export async function POST(req: Request) {
  const secret = process.env.JOBS_SECRET || "";
  if ((req.headers.get('x-jobs-secret') || "") !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // pick one pending job
  const { rows } = await query<{ id: string; type: string; payload: any }>(
    `UPDATE jobs SET status='running', started_at=NOW() WHERE id IN (
      SELECT id FROM jobs WHERE status='pending' ORDER BY created_at ASC LIMIT 1
    ) RETURNING id, type, payload`
  );
  const job = rows[0];
  if (!job) return NextResponse.json({ ok: true, message: 'no-jobs' });
  try {
    const payload = typeof job.payload === 'string' ? JSON.parse(job.payload) : job.payload || {};
    if (job.type === 'create_ppt') {
      const { userId, creationId, buffer } = payload;
      const fileName = `creations/${userId}/${Date.now()}.pptx`;
      const buf = Buffer.from(String(buffer || ''), 'base64');
      const up = await uploadToStorage(buf, fileName, 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
      await query(`UPDATE creations SET file_url=$2, status='ready' WHERE id=$1`, [creationId, up.url]);
    } else if (job.type === 'create_docx') {
      const { userId, creationId, url } = payload;
      // already uploaded docx at `url`
      await query(`UPDATE creations SET file_url=$2, status='ready' WHERE id=$1`, [creationId, url]);
    }
    await query(`UPDATE jobs SET status='completed', completed_at=NOW() WHERE id=$1`, [job.id]);
    return NextResponse.json({ ok: true, id: job.id });
  } catch (e: any) {
    await query(`UPDATE jobs SET status='failed', last_error=$2 WHERE id=$1`, [job.id, String(e?.message || e)]);
    return NextResponse.json({ error: 'job-failed', id: job.id }, { status: 500 });
  }
}


