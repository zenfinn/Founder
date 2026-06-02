"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, FolderOpen, Home, LayoutGrid, MessageCircle, Sparkles, Users } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Home", Icon: Home, match: (path) => path === "/dashboard" },
  { href: "/community", label: "Community", Icon: Users, match: (path) => path.startsWith("/community") },
  { href: "/inbox", label: "Chats", Icon: MessageCircle, match: (path) => path.startsWith("/inbox") },
  { href: "/resources", label: "Ressourcen", Icon: FolderOpen, match: (path) => path.startsWith("/resources") },
  { href: "/showcases", label: "Showcases", Icon: LayoutGrid, match: (path) => path.startsWith("/showcases") },
  { href: "/mentoren", label: "Mentoren", Icon: Sparkles, match: (path) => path.startsWith("/mentoren") },
  { href: "/events", label: "Events", Icon: Calendar, match: (path) => path.startsWith("/events") },
];

export function CockpitBottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="Hauptnavigation"
      className="pointer-events-auto fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-[#1a3aad]/35 bg-[#0a0a0a]/60 px-2 py-2 backdrop-blur-xl"
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
            className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
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
