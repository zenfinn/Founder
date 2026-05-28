"use client";

import Link from "next/link";
import { FounderProUpgradeButton } from "@/components/FounderProUpgradeButton";

export function LandingJoinCards() {
  return (
    <section id="join" className="py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto px-4">
        <article className="flex h-full flex-col justify-between rounded-3xl bg-[#1d4ed8] p-8 text-white sm:p-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">Kostenlos beitreten</p>
            <h2 className="mt-4 font-serif text-4xl font-bold tracking-tight sm:text-5xl">Kostenlos starten</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-blue-50">
              Registriere dich, lade deinen Gewerbenachweis hoch und erhalte deinen Rang – völlig kostenlos.
            </p>
          </div>
          <Link
            href="/register"
            className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-white px-6 py-4 text-base font-bold text-[#1d4ed8] transition hover:bg-blue-50 sm:w-auto"
          >
            Jetzt kostenlos starten
          </Link>
        </article>

        <article className="flex h-full flex-col justify-between rounded-3xl border border-blue-500/30 bg-[#0c1e33] p-8 text-white shadow-lg shadow-blue-950/20 sm:p-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">Founder Pro</p>
            <h2 className="mt-4 font-serif text-4xl font-bold tracking-tight sm:text-5xl">Pro-Mitgliedschaft</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
              Sichere dir den ultimativen Vorsprung in der Community mit exklusiven Premium-Vorteilen.
            </p>
          </div>
          <FounderProUpgradeButton
            label="Pro beitreten"
            cancelPath="/#join"
            unauthenticatedPath="/register?intent=founder_pro"
            className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-sky-300 px-6 py-4 text-base font-bold text-[#0c1e33] transition hover:bg-white sm:w-auto"
            errorClassName="mt-3 text-sm font-semibold text-sky-200"
          />
        </article>
      </div>
    </section>
  );
}
