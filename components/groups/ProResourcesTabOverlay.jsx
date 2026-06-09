"use client";

import Link from "next/link";
import { FounderProUpgradeButton } from "@/components/FounderProUpgradeButton";
import { Lock, Users } from "lucide-react";

export function ProResourcesTabOverlay({ cancelPath = "/community", variant = "pro", groupId }) {
  const isJoinVariant = variant === "join";

  return (
    <div className="relative min-h-[560px] overflow-hidden rounded-xl border border-[#1a3aad]/30 bg-[#0f0f0f]">
      <div className="relative flex min-h-[560px] flex-col items-center justify-center px-6 py-16 text-center sm:px-10">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1a3aad]/15 ring-1 ring-[#1a3aad]/25">
          {isJoinVariant ? <Users className="h-8 w-8 text-[#1a3aad]" /> : <Lock className="h-8 w-8 text-[#1a3aad]" />}
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#1a3aad]">
          {isJoinVariant ? "Community beitreten" : "Founder Pro"}
        </p>
        <h2 className="mt-3 max-w-xl font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {isJoinVariant ? "Ressourcen für Mitglieder" : "Alle Community-Ressourcen"}
        </h2>
        <p className="mt-4 max-w-lg text-sm leading-7 text-neutral-400 sm:text-base">
          {isJoinVariant
            ? "Tritt dieser Community bei, um ihre Ressourcen zu sehen. Für Ressourcen weiterer Gruppen brauchst du Founder Pro."
            : "Du siehst bereits Ressourcen deiner Community. Mit Founder Pro schaltest du alle Gruppen frei."}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          {isJoinVariant && groupId ? (
            <Link
              href={`/community/${groupId}`}
              className="inline-flex rounded-xl bg-[#1a3aad] px-6 py-4 text-base font-bold text-white transition hover:bg-[#2f61df]"
            >
              Community beitreten
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
            Pro-Vorteile ansehen
          </Link>
        </div>
      </div>
    </div>
  );
}
