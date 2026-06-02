"use client";

import Link from "next/link";
import { Calendar, FolderOpen, Home, LayoutGrid, MessageCircle, Sparkles, Users } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Home", Icon: Home },
  { href: "/community", label: "Community", Icon: Users },
  { href: "/inbox", label: "Chats", Icon: MessageCircle },
  { href: "/resources", label: "Ressourcen", Icon: FolderOpen },
  { href: "/showcases", label: "Showcases", Icon: LayoutGrid },
  { href: "/mentoren", label: "Mentoren", Icon: Sparkles },
  { href: "/events", label: "Events", Icon: Calendar },
];

export function DashboardBottomNav({ active = "/dashboard" }) {
  return (
    <nav
      aria-label="Hauptnavigation"
      className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-[#1a3aad]/35 bg-[#0a0a0a]/55 px-2 py-2 backdrop-blur-xl"
    >
      {navItems.map(({ href, label, Icon }) => {
        const isActive = active === href;
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
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
