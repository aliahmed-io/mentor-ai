import { auth, currentUser } from "@clerk/nextjs/server";

export async function requireAuth() {
  const session = await auth();
  if (!session?.userId) {
    throw new Error("Unauthorized");
  }
  const user = await currentUser();
  return { userId: session.userId, user };
}


