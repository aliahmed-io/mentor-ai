"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { Home, MessageCircle, BookOpen, FilePlus2, Timer, HeartHandshake, Settings, GraduationCap, FileText } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/chat", label: "Tutor", icon: MessageCircle },
  { href: "/quiz", label: "Quiz", icon: GraduationCap },
  { href: "/create", label: "Create", icon: FilePlus2 },
  { href: "/creations", label: "Creations", icon: FileText },
  { href: "/pomodoro", label: "Pomodoro", icon: Timer },
  { href: "/prayers", label: "Prayers", icon: HeartHandshake },
  { href: "/settings", label: "Profile", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-neutral-800 bg-black/80 text-neutral-200 backdrop-blur-sm">
      <div className="h-14 flex items-center px-4 border-b border-neutral-800">
        <Link href="/dashboard" className="inline-flex items-center gap-2">
          <img src="/white-long-logo.svg" alt="Mentor AI" className="h-6 w-auto" />
        </Link>
      </div>
      <nav className="p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-3 border-t border-neutral-800">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-400">Account</span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </aside>
  );
}


