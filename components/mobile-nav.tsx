"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, MessageCircle, Settings, GraduationCap, FilePlus2, Timer, HeartHandshake } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/chat", label: "Tutor", icon: MessageCircle },
    { href: "/quiz", label: "Quiz", icon: GraduationCap },
    { href: "/create", label: "Create", icon: FilePlus2 },
    { href: "/pomodoro", label: "Pomodoro", icon: Timer },
    { href: "/prayers", label: "Prayers", icon: HeartHandshake },
    { href: "/settings", label: "Profile", icon: Settings },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Navigation</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon as any;
                  const active = pathname?.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${active ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              
              <div className="border-t pt-4">
                <div className="flex items-center gap-3 p-3">
                  <UserButton afterSignOutUrl="/" />
                  <span className="text-sm text-muted-foreground">Account</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
