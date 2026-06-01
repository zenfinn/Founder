"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { UserHeaderControls } from "@/components/UserHeaderControls";
import { Calendar, FolderOpen, Home, LayoutGrid, MessageCircle, Star, Trophy, Users } from "lucide-react";

export function AppHeader({ active }) {
  const [open, setOpen] = useState(false);
  const links = [
    { href: "/dashboard", label: "Home", Icon: Home },
    { href: "/raenge", label: "Ränge", Icon: Star },
    { href: "/leaderboard", label: "Leaderboard", Icon: Trophy },
    { href: "/community", label: "Community", Icon: Users },
    { href: "/showcases", label: "Showcases", Icon: LayoutGrid },
    { href: "/resources", label: "Ressourcen", Icon: FolderOpen },
    { href: "/events", label: "Events", Icon: Calendar },
    { href: "/mentoren", label: "Mentoren", Icon: Star },
    { href: "/inbox", label: "Chats", Icon: MessageCircle },
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link href="/">
          <BrandMark />
        </Link>
        <button
          onClick={() => setOpen((current) => !current)}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 md:hidden"
          type="button"
        >
          Menü
        </button>
        <nav className="hidden items-center gap-2 overflow-x-auto text-sm font-bold text-slate-600 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-full px-3 py-2 transition ${
                active === link.href ? "bg-founder-600 text-white" : "hover:bg-slate-100"
              }`}
            >
              <link.Icon className="mr-1 inline h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex">
          <UserHeaderControls variant="app" />
        </div>
      </div>
      {open && (
        <nav className="mx-auto mt-4 grid max-w-6xl gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-600 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`rounded-xl px-3 py-2 transition ${active === link.href ? "bg-founder-600 text-white" : "hover:bg-slate-100"}`}
            >
              <link.Icon className="mr-2 inline h-4 w-4" />
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex items-center justify-end border-t border-slate-100 pt-3">
            <UserHeaderControls variant="app" onNavigate={() => setOpen(false)} />
          </div>
        </nav>
      )}
    </header>
  );
}
