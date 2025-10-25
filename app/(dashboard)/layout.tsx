import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { NotesWidget } from "@/components/notes-widget";
import { SelectionToolbar } from "@/components/selection-toolbar";
import { MobileNav } from "@/components/mobile-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr] md:grid-rows-[1fr] md:grid-cols-[16rem_1fr]">
      <Sidebar />
      <div className="min-h-screen flex flex-col">
        <MobileNav />
        <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">{children}</main>
        <NotesWidget />
        <SelectionToolbar />
      </div>
    </div>
  );
}


