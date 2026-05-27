"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { sampleEvents } from "@/lib/founder-data";
import { RankBadge } from "@/components/RankBadge";

function formatPrice(priceCents = 0) {
  if (!priceCents) return "Kostenlos";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(priceCents / 100);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function EventsList() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [previewEvents] = useState(sampleEvents.slice(0, 3));

  useEffect(() => {
    async function loadEvents() {
      await supabase
        .from("events")
        .select("id")
        .eq("status", "published")
        .limit(1);
    }

    loadEvents();
  }, [supabase]);

  return (
    <div className="relative mt-8">
      <div className="pointer-events-none select-none opacity-45 grayscale">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {previewEvents.map((event) => (
            <article key={event.id} className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
              <div className="relative h-44">
                <Image
                  src={event.image_url ?? "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80"}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <RankBadge rank={event.min_rank} />
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    {formatPrice(event.price_cents)}
                  </span>
                </div>
                <p className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {event.category ?? "Allgemein"}
                </p>
                <h2 className="mt-5 font-serif text-2xl font-bold text-slate-950">{event.title}</h2>
                <p className="mt-3 text-sm font-semibold text-slate-600">{formatDate(event.starts_at)}</p>
                {event.location_text && <p className="mt-1 text-sm text-slate-500">{event.location_text}</p>}
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="mx-4 max-w-lg rounded-[1.75rem] border border-slate-200 bg-white/95 px-8 py-10 text-center shadow-xl backdrop-blur">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-600">Coming Soon</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-slate-950">Events starten bald</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Wir finalisieren gerade Tickets, Stripe-Checkout und den Event-Kalender. Unten kannst du schon jetzt dein
            Event vorschlagen.
          </p>
        </div>
      </div>
    </div>
  );
}
