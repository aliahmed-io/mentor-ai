import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Protect authenticated areas (UI + API). Adjust as needed.
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/quiz(.*)",
  "/create(.*)",
  "/pomodoro(.*)",
  "/prayers(.*)",
  "/chat(.*)",
  "/settings(.*)",
  "/document(.*)",
  "/api/(documents|upload|chat|document|notes|quizzes|create|ai|prayers)(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

// Recommended matcher from Clerk for Next.js
export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/(api|trpc)(.*)",
  ],
};
