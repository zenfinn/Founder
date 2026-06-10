"use client";

import Link from "next/link";
import { FounderProUpgradeButton } from "@/components/FounderProUpgradeButton";

const freeBenefits = [
  "1 Community beitreten",
  "Tools deiner Gruppe",
  "Chat, Wins & Untergruppen",
];

const proBenefits = [
  "Unbegrenzt viele Communities",
  "Tools aller Gruppen",
  "Mentoren & Premium-Zugang",
];

export function LandingJoinCards() {
  return (
    <section id="join" className="mt-8">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <article className="flex h-full flex-col justify-between rounded-xl border border-[#1a3aad]/30 bg-[#0f0f0f] p-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#1a3aad]">Kostenlos</p>
            <h2 className="mt-2 font-serif text-2xl font-bold text-white">Free starten</h2>
            <ul className="mt-4 space-y-2 text-sm text-neutral-400">
              {freeBenefits.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[#1a3aad]">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <Link
            href="/register"
            className="mt-6 inline-flex items-center justify-center rounded-xl border border-[#1a3aad]/40 px-5 py-3 text-sm font-bold text-white transition hover:border-[#1a3aad]"
          >
            Jetzt kostenlos starten
          </Link>
        </article>

        <article className="flex h-full flex-col justify-between rounded-xl border border-[#1a3aad]/50 bg-[#0f0f0f] p-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5b8cff]">Founder Pro</p>
            <h2 className="mt-2 font-serif text-2xl font-bold text-white">Pro-Mitgliedschaft</h2>
            <ul className="mt-4 space-y-2 text-sm text-neutral-300">
              {proBenefits.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[#5b8cff]">★</span>
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
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#1a3aad] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#2f61df]"
          />
        </article>
      </div>
    </section>
  );
}
