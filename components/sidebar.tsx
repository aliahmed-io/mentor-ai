"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { Home, MessageCircle, BookOpen, FilePlus2, Timer, HeartHandshake, Settings, GraduationCap } from "lucide-react";
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
  { href: "/pomodoro", label: "Pomodoro", icon: Timer },
  { href: "/prayers", label: "Prayers", icon: HeartHandshake },
  { href: "/settings", label: "Profile", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r bg-white/80 backdrop-blur-sm">
      <div className="h-14 flex items-center px-4 border-b">
        <Link href="/dashboard" className="font-semibold text-lg">
          Mentor <span className="text-blue-600">AI</span>
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
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-blue-50 ${
                active ? "bg-blue-100 text-blue-800" : "text-gray-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-3 border-t">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Account</span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </aside>
  );
}


