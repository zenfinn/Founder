"use client";

import Link from "next/link";
import { FounderProUpgradeButton } from "@/components/FounderProUpgradeButton";
import { Lock } from "lucide-react";

export function ProResourcesPageOverlay({ cancelPath = "/resources" }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[2rem] bg-slate-950/55 p-6 backdrop-blur-md">
      <div className="max-w-lg rounded-[2rem] border border-white/10 bg-white p-8 text-center shadow-2xl shadow-slate-950/30 sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-founder-600/10 ring-1 ring-founder-600/15">
          <Lock className="h-8 w-8 text-founder-600" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-founder-600">Founder Pro</p>
        <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Exklusiv für Founder Pro Mitglieder
        </h2>
        <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
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
