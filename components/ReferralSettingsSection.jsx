"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ReferralLinkCopy } from "@/components/ReferralLinkCopy";
import { Loader2 } from "lucide-react";

export function ReferralSettingsSection() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [links, setLinks] = useState(null);

  useEffect(() => {
    async function loadReferralLinks() {
      try {
        const response = await fetch("/api/referrals/me");
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          setError(payload.error ?? "Referral-Link konnte nicht geladen werden.");
          return;
        }

        setLinks(payload);
      } catch {
        setError("Referral-Link konnte nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    }

    loadReferralLinks();
  }, []);

  return (
    <section id="referral" className="mt-10 rounded-[1.5rem] border border-slate-200 bg-white p-6">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-600">Referral</p>
      <h2 className="mt-3 font-serif text-3xl font-bold text-slate-950">Dein persönlicher Referral-Link</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        Dein einzigartiger Link wird automatisch generiert. Teile ihn und erhalte 10% Provision auf jeden Founder Pro
        Umsatz — auch bei Rabatt-Checkouts.
      </p>

      {loading && (
        <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Link wird generiert...
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}{" "}
          {!error.includes("logge") && (
            <Link href="/login" className="font-bold text-founder-600">
              Einloggen
            </Link>
          )}
        </p>
      )}

      {links && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <ReferralLinkCopy label="Haupt-Link (Registrierung)" href={links.register_link} />
          <ReferralLinkCopy label="Founder Pro Link" href={links.pro_link} />
        </div>
      )}

      {links?.referral_code && (
        <p className="mt-4 text-xs font-semibold text-slate-400">Dein Code: {links.referral_code}</p>
      )}
    </section>
  );
}
