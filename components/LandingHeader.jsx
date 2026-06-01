"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { UserHeaderControls } from "@/components/UserHeaderControls";
import { BookOpen, Calendar, LayoutGrid, Menu, Star, Trophy, Users, X } from "lucide-react";

const links = [
  { href: "/raenge", label: "Ränge", Icon: Star },
  { href: "/leaderboard", label: "Leaderboard", Icon: Trophy },
  { href: "/community", label: "Community", Icon: Users },
  { href: "/showcases", label: "Showcases", Icon: LayoutGrid },
  { href: "/events", label: "Events", Icon: Calendar },
  { href: "/mentoren", label: "Mentoren", Icon: BookOpen },
];

export function LandingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link href="/">
          <BrandMark />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
          {links.map(({ href, label, Icon }) => (
            <Link key={href} href={href} className="inline-flex items-center gap-1 transition hover:text-founder-600">
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex">
          <UserHeaderControls variant="landing" />
        </div>
        <button
          className="rounded-full border border-slate-200 p-2 md:hidden"
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Menü öffnen"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <nav className="mx-auto mt-4 grid max-w-6xl gap-2 rounded-3xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-700 md:hidden">
          {links.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-2xl px-3 py-2 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          <div className="mt-2 flex items-center justify-end border-t border-slate-100 pt-3">
            <UserHeaderControls variant="landing" onNavigate={() => setOpen(false)} />
          </div>
        </nav>
      )}
    </header>
  );
}
