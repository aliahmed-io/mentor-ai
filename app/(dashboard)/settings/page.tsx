import { auth, currentUser } from "@clerk/nextjs/server";
import { query } from "@/lib/db";

export default async function SettingsPage() {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId) return null;
  const { rows } = await query<{ subscription_tier: string }>(
    `SELECT subscription_tier FROM users WHERE id=$1`,
    [userId]
  );
  const tier = rows[0]?.subscription_tier ?? "free";
  return (
    <div className="space-y-6 max-w-xl">
      <h2 className="text-2xl font-semibold">Settings</h2>
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">Signed in as</div>
        <div>{user?.emailAddresses?.[0]?.emailAddress}</div>
      </div>
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">Account Type</div>
        <div className="font-medium capitalize">{tier}</div>
      </div>
    </div>
  );
}


