import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Mentor AI",
  description: "Smart Study Partner",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <html lang="en" suppressHydrationWarning>
        <body className="antialiased min-h-screen text-foreground bg-[radial-gradient(1200px_600px_at_0%_0%,#fff7ed,transparent_60%),radial-gradient(1000px_500px_at_100%_0%,#eef2ff,transparent_60%),radial-gradient(1000px_500px_at_50%_100%,#ecfeff,transparent_60%)]">
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
