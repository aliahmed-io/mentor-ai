"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, MessageCircle, Settings, GraduationCap, FilePlus2, Timer, HeartHandshake, FileText } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/chat", label: "Tutor", icon: MessageCircle },
    { href: "/quiz", label: "Quiz", icon: GraduationCap },
    { href: "/create", label: "Create", icon: FilePlus2 },
    { href: "/creations", label: "Creations", icon: FileText },
    { href: "/pomodoro", label: "Pomodoro", icon: Timer },
    { href: "/prayers", label: "Prayers", icon: HeartHandshake },
    { href: "/settings", label: "Profile", icon: Settings },
  ];

  // prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Mobile top bar with brand */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-3 py-2 bg-white/80 dark:bg-neutral-900/80 backdrop-blur border-b border-neutral-200 dark:border-neutral-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/white-long-logo.svg" alt="Mentor AI" width={40} height={40} className="h-6 w-40" />
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className={`md:hidden fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`} aria-modal="true" role="dialog" onClick={() => setIsOpen(false)}>
        {/* overlay */}
        <div className={`absolute inset-0 bg-black/50 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`} />
        {/* panel */}
        <div className={`absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white dark:bg-neutral-900 shadow-xl border-l border-neutral-200 dark:border-neutral-800 transform transition-transform duration-200 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center" onClick={() => setIsOpen(false)}>
                <Image src="/white-long-logo.svg" alt="Mentor AI" width={60} height={60} className="h-12 w-120" />
              </Link>
              <button onClick={() => setIsOpen(false)} aria-label="Close menu" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="p-5 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon as any;
                  const active = pathname?.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${active ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
            </nav>

            <div className="mt-auto p-5 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <UserButton afterSignOutUrl="/" />
                <div className="text-sm text-neutral-600 dark:text-neutral-300">Account</div>
              </div>
            </div>
          </div>
      </div>
    </>
  );
}
