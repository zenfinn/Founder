"use client";

import Link from "next/link";
import { FounderProUpgradeButton } from "@/components/FounderProUpgradeButton";
import { Lock } from "lucide-react";

export function ProResourcesTabOverlay({ cancelPath = "/community" }) {
  return (
    <div className="relative min-h-[560px] overflow-hidden rounded-[2rem] border border-slate-200 bg-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_55%),linear-gradient(180deg,_rgba(15,23,42,0.03),_rgba(15,23,42,0.06))]" />
      <div className="relative flex min-h-[560px] flex-col items-center justify-center px-6 py-16 text-center sm:px-10">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-founder-600/10 ring-1 ring-founder-600/15">
          <Lock className="h-8 w-8 text-founder-600" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-founder-600">Founder Pro</p>
        <h2 className="mt-3 max-w-xl font-serif text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Nur für Pro-Mitglieder
        </h2>
        <p className="mt-4 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">
          Schalte unbegrenzten Zugriff auf alle Tools, Lieferanten und Netzwerke frei.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <FounderProUpgradeButton
            label="Pro freischalten"
            cancelPath={cancelPath}
            className="inline-flex rounded-2xl bg-founder-600 px-6 py-4 text-base font-bold text-white transition hover:bg-founder-700 disabled:cursor-not-allowed disabled:opacity-70"
            errorClassName="mt-3 max-w-md text-sm font-semibold text-red-600"
          />
          <Link href="/#join" className="text-sm font-bold text-founder-600 transition hover:text-founder-700">
            Pro-Vorteile ansehen
          </Link>
        </div>
      </div>
    </div>
  );
}
