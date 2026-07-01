"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, FolderOpen, Calendar, Home, LayoutGrid, MessageCircle, Sparkles, Users } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Home", Icon: Home, match: (path) => path === "/dashboard" },
  {
    href: "/jarvis",
    label: "Jarvis",
    Icon: Bot,
    match: (path) => path.startsWith("/jarvis") || path.startsWith("/onboarding/founder"),
  },
  { href: "/community", label: "Community", Icon: Users, match: (path) => path.startsWith("/community") },
  { href: "/inbox", label: "Chats", Icon: MessageCircle, match: (path) => path.startsWith("/inbox") },
  { href: "/resources", label: "Tools", Icon: FolderOpen, match: (path) => path.startsWith("/resources") },
  { href: "/events", label: "Meetups", Icon: Calendar, match: (path) => path.startsWith("/events") },
  { href: "/showcases", label: "Showcases", Icon: LayoutGrid, match: (path) => path.startsWith("/showcases") },
  { href: "/mentoren", label: "Mentoren", Icon: Sparkles, match: (path) => path.startsWith("/mentoren") },
];

export function CockpitBottomNav() {
  const pathname = usePathname() ?? "";

  if (pathname.startsWith("/onboarding")) {
    return null;
  }

  return (
    <nav
      aria-label="Hauptnavigation"
      className="pointer-events-auto fixed bottom-5 left-1/2 z-50 flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 items-center gap-0.5 overflow-x-auto rounded-2xl border border-[#1a3aad]/35 bg-[#0a0a0a]/60 px-1.5 py-2 backdrop-blur-xl sm:gap-1 sm:px-2"
    >
      {navItems.map(({ href, label, Icon, match }) => {
        const isActive = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            title={label}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition sm:h-11 sm:w-11 ${
              isActive
                ? "bg-[#1a3aad] text-white"
                : "text-neutral-400 hover:border hover:border-[#1a3aad]/50 hover:text-white"
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 1.75} />
          </Link>
        );
      })}
    </nav>
  );
}
