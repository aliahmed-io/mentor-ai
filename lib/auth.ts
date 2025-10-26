import { auth, currentUser } from "@clerk/nextjs/server";
import { query } from "@/lib/db";

export async function requireAuth() {
  const session = await auth();
  if (!session?.userId) {
    throw new Error("Unauthorized");
  }
  const user = await currentUser();
  // Ensure a corresponding DB user exists to satisfy foreign key constraints
  try {
    const email = user?.emailAddresses?.[0]?.emailAddress || "";
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
    await query(
      `INSERT INTO users (id, clerk_id, email, name) VALUES ($1,$2,$3,$4)
       ON CONFLICT (id) DO UPDATE SET email=COALESCE(NULLIF(EXCLUDED.email,''), users.email), name=COALESCE(NULLIF(EXCLUDED.name,''), users.name)`,
      [session.userId, session.userId, email, name]
    );
  } catch {}
  return { userId: session.userId, user };
}

export async function ensureDbUser(userId: string, opts?: { email?: string; name?: string }) {
  if (!userId) return;
  try {
    await query(
      `INSERT INTO users (id, clerk_id, email, name) VALUES ($1,$2,$3,$4)
       ON CONFLICT (id) DO NOTHING`,
      [userId, userId, opts?.email || "", opts?.name || ""]
    );
  } catch {}
}


