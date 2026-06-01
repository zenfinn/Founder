"use client";

import Link from "next/link";
import { FounderProUpgradeButton } from "@/components/FounderProUpgradeButton";
import { Lock } from "lucide-react";

export function ProResourcesGate({ profile, title = "Founder Pro erforderlich", description, children }) {
  if (!profile) {
    return (
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
        Zugriff wird geprüft...
      </div>
    );
  }

  const allowed =
    profile?.founder_pro === true ||
    profile?.is_pro === true ||
    profile?.system_role === "owner" ||
    profile?.system_role === "admin" ||
    String(profile?.plan ?? "").toLowerCase() === "pro" ||
    String(profile?.plan ?? "").toLowerCase() === "founder_pro";

  if (allowed) return children;

  return (
    <div className="mt-8 rounded-[2rem] border border-founder-200 bg-founder-50 p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
        <Lock className="h-7 w-7 text-founder-600" />
      </div>
      <h2 className="mt-5 font-serif text-2xl font-bold text-slate-950">{title}</h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">
        {description ??
          "Schalte unbegrenzten Zugriff auf alle Tools, Lieferanten und Netzwerke frei."}
      </p>
      <div className="mt-6 flex flex-col items-center gap-3">
        <FounderProUpgradeButton />
        <Link href="/community" className="text-sm font-bold text-founder-600 hover:text-founder-700">
          Zurück zur Community
        </Link>
      </div>
    </div>
  );
}
