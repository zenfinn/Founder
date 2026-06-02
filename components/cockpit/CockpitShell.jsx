"use client";

import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { UserHeaderControls } from "@/components/UserHeaderControls";
import { CockpitBottomNav } from "@/components/cockpit/CockpitBottomNav";
import { GlobeBackground } from "@/components/cockpit/GlobeBackground";

export function CockpitShell({ children }) {
  return (
    <div data-cockpit="true" className="cockpit-root relative min-h-screen bg-[#050505] pb-28 text-neutral-100">
      <GlobeBackground />

      <header className="relative z-20 flex items-center justify-between px-4 py-4 md:px-6">
        <Link href="/dashboard" className="opacity-90 transition hover:opacity-100">
          <BrandMark />
        </Link>
        <div className="cockpit-header-controls">
          <UserHeaderControls variant="app" />
        </div>
      </header>

      <div className="relative z-10">{children}</div>
      <CockpitBottomNav />
    </div>
  );
}
