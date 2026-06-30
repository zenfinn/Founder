"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const initialMetrics = [
  { label: "Founder Pro", value: "0", detail: "Aktive Pro-Profile" },
  { label: "Registrierte Mitglieder", value: "0", detail: "Profile mit Account" },
  { label: "Ausstehende Verifikationen", value: "0", detail: "Dokumente prüfen" },
  { label: "Event-Umsatz", value: "0,00 €", detail: "Bezahlte Tickets" },
];

export function AdminMetrics() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [metrics, setMetrics] = useState(initialMetrics);

  useEffect(() => {
    async function loadMetrics() {
      const [{ count: proCount }, { count: profileCount }, { count: pendingVerificationCount }, { data: tickets }] =
        await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("founder_pro", true),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("verification_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("event_tickets").select("amount_cents").eq("status", "paid"),
        ]);

      const ticketRevenueCents = (tickets ?? []).reduce((sum, ticket) => sum + (ticket.amount_cents ?? 0), 0);

      setMetrics([
        { label: "Founder Pro", value: String(proCount ?? 0), detail: "Aktive Pro-Profile" },
        { label: "Registrierte Mitglieder", value: String(profileCount ?? 0), detail: "Profile mit Account" },
        { label: "Ausstehende Verifikationen", value: String(pendingVerificationCount ?? 0), detail: "Dokumente prüfen" },
        {
          label: "Event-Umsatz",
          value: new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(ticketRevenueCents / 100),
          detail: "Bezahlte Tickets",
        },
      ]);
    }

    loadMetrics();
  }, [supabase]);

  return (
    <div className="mt-8 grid gap-4 md:grid-cols-4">
      {metrics.map((metric) => (
        <article key={metric.label} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
          <p className="text-sm font-bold text-slate-500">{metric.label}</p>
          <p className="mt-2 font-serif text-4xl font-bold text-slate-950">{metric.value}</p>
          <p className="mt-2 text-sm text-slate-600">{metric.detail}</p>
        </article>
      ))}
    </div>
  );
}
