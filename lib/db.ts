import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

export const pool = new Pool({ connectionString, max: 5, ssl: getSsl() });

function getSsl() {
  // Neon/Render often requires SSL; allow disabling in local dev
  if (process.env.PGSSL === "disable") return false as unknown as undefined;
  return { rejectUnauthorized: false } as unknown as undefined;
}

export async function query<T = unknown>(text: string, params: unknown[] = []): Promise<{ rows: T[] }> {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return { rows: res.rows as T[] };
  } finally {
    client.release();
  }
}


