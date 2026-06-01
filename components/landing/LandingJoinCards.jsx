"use client";

import Link from "next/link";
import { FounderProUpgradeButton } from "@/components/FounderProUpgradeButton";

const freeBenefits = [
  { icon: "✓", text: "Einstieg in die Community", tone: "text-blue-50" },
  { icon: "✓", text: "Zugang zu Events & Mentoren", tone: "text-blue-50" },
  { icon: "⚠", text: "Maximal 1 Gruppe", tone: "text-amber-100" },
  { icon: "❌", text: "Keine Ressourcen", tone: "text-blue-200/80" },
];

const proBenefits = [
  "Unbegrenzter Zugriff auf ALLE Gruppen",
  "Volle Premium-Ressourcen & Tools",
  "Alle Events & Mentoren",
];

export function LandingJoinCards() {
  return (
    <section id="join" className="py-10">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 md:grid-cols-2">
        <article className="flex h-full flex-col justify-between rounded-3xl bg-[#1d4ed8] p-8 text-white sm:p-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">Kostenlos beitreten</p>
            <h2 className="mt-4 font-serif text-4xl font-bold tracking-tight sm:text-5xl">Kostenlos starten</h2>
            <ul className="mt-6 space-y-3 text-sm leading-6 sm:text-base">
              {freeBenefits.map((item) => (
                <li key={item.text} className={`flex items-start gap-3 ${item.tone}`}>
                  <span className="mt-0.5 shrink-0 font-bold">{item.icon}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
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
            <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-200 sm:text-base">
              {proBenefits.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 text-sky-300">★</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <FounderProUpgradeButton
            label="Pro beitreten"
            cancelPath="/#join"
            unauthenticatedPath="/register?intent=founder_pro"
            stripeProductId="prod_UYfGh1P7PJkCin"
            showError={false}
            className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-sky-300 px-6 py-4 text-base font-bold text-[#0c1e33] transition hover:bg-white sm:w-auto"
          />
        </article>
      </div>
    </section>
  );
}
