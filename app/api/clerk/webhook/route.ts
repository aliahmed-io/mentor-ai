import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { query } from "@/lib/db";

// Clerk Webhook: create DB user on user.created
export async function POST(req: Request) {
  const payload = await req.text();
  const hdrs = await (headers() as any);
  const svix_id = hdrs.get("svix-id");
  const svix_timestamp = hdrs.get("svix-timestamp");
  const svix_signature = hdrs.get("svix-signature");
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Missing signature headers" }, { status: 400 });
  }

  const secret = process.env.CLERK_WEBHOOK_SECRET || "";
  try {
    const { Webhook } = await import("svix");
    const wh = new Webhook(secret);
    const evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as any;

    // Handle only user.created for now
    if (evt?.type === "user.created") {
      const u = evt.data;
      const clerkId: string = u.id;
      const email: string = u.email_addresses?.[0]?.email_address || "";
      const name: string = [u.first_name, u.last_name].filter(Boolean).join(" ");

      try {
        await query(
          `INSERT INTO users (id, clerk_id, email, name) VALUES ($1,$2,$3,$4)
           ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email, name=EXCLUDED.name`,
          [clerkId, clerkId, email, name]
        );
      } catch (e) {
        // ignore DB errors to not block webhook retries
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }
}
