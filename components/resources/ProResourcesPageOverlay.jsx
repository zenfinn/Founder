"use client";

import Link from "next/link";
import { FounderProUpgradeButton } from "@/components/FounderProUpgradeButton";
import { Lock, Users } from "lucide-react";

export function ProResourcesPageOverlay({ cancelPath = "/resources", variant = "pro" }) {
  const isJoinVariant = variant === "join";

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[2rem] bg-[#050505]/70 p-6 backdrop-blur-md">
      <div className="max-w-lg rounded-xl border border-[#1a3aad]/30 bg-[#0f0f0f] p-8 text-center sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1a3aad]/15 ring-1 ring-[#1a3aad]/25">
          {isJoinVariant ? <Users className="h-8 w-8 text-[#1a3aad]" /> : <Lock className="h-8 w-8 text-[#1a3aad]" />}
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#1a3aad]">
          {isJoinVariant ? "Community beitreten" : "Founder Pro"}
        </p>
        <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {isJoinVariant ? "Tritt einer Gruppe bei" : "Exklusiv für Founder Pro Mitglieder"}
        </h2>
        <p className="mt-4 text-sm leading-7 text-neutral-400 sm:text-base">
          {isJoinVariant
            ? "Im Free-Plan siehst du Ressourcen deiner Community. Tritt einer Gruppe bei — für alle Communities brauchst du Founder Pro."
            : "Schalte unbegrenzten Zugriff auf alle Tools, Lieferanten und Netzwerke frei."}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          {isJoinVariant ? (
            <Link
              href="/community"
              className="inline-flex rounded-xl bg-[#1a3aad] px-6 py-4 text-base font-bold text-white transition hover:bg-[#2f61df]"
            >
              Community entdecken
            </Link>
          ) : (
            <FounderProUpgradeButton
              label="Pro freischalten"
              cancelPath={cancelPath}
              className="inline-flex rounded-xl bg-[#1a3aad] px-6 py-4 text-base font-bold text-white transition hover:bg-[#2f61df] disabled:cursor-not-allowed disabled:opacity-70"
              errorClassName="mt-3 max-w-md text-sm font-semibold text-red-400"
            />
          )}
          <Link href="/#join" className="text-sm font-bold text-[#1a3aad] transition hover:text-[#2f61df]">
            {isJoinVariant ? "Pro-Vorteile ansehen" : "Pro-Vorteile ansehen"}
          </Link>
        </div>
      </div>
    </div>
  );
}
