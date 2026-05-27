"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { ranks, sampleEvents } from "@/lib/founder-data";
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
  const [events, setEvents] = useState(sampleEvents);
  const [category, setCategory] = useState("Alle");
  const [rank, setRank] = useState("Alle");
  const [dateRange, setDateRange] = useState("Alle");

  useEffect(() => {
    async function loadEvents() {
      const { data, error } = await supabase
        .from("events")
        .select("id,slug,title,starts_at,price_cents,min_rank,location_text,status,category,image_url")
        .eq("status", "published")
        .order("starts_at", { ascending: true });

      if (!error && data?.length) {
        setEvents(data);
      }
    }

    loadEvents();
  }, [supabase]);

  const categories = ["Alle", ...new Set(events.map((event) => event.category ?? "Allgemein"))];
  const filteredEvents = events.filter((event) => {
    const categoryMatch = category === "Alle" || (event.category ?? "Allgemein") === category;
    const rankMatch = rank === "Alle" || event.min_rank === rank;
    const eventDate = new Date(event.starts_at);
    const now = new Date();
    const days = dateRange === "7 Tage" ? 7 : dateRange === "30 Tage" ? 30 : null;
    const dateMatch = !days || (eventDate >= now && eventDate <= new Date(now.getTime() + days * 24 * 60 * 60 * 1000));
    return categoryMatch && rankMatch && dateMatch;
  });

  return (
    <>
      <div className="mt-8 grid gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Kategorie</span>
          <select className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Rang</span>
          <select className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" value={rank} onChange={(event) => setRank(event.target.value)}>
            <option>Alle</option>
            {ranks.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Datum</span>
          <select className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" value={dateRange} onChange={(event) => setDateRange(event.target.value)}>
            <option>Alle</option>
            <option>7 Tage</option>
            <option>30 Tage</option>
          </select>
        </label>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {filteredEvents.map((event) => {
        return (
          <article key={event.id} className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
            <div className="relative h-44">
              <Image src={event.image_url ?? "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80"} alt="" fill className="object-cover" sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw" />
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
              <Link
                href={`/events/${event.slug ?? event.id}`}
                className="mt-6 block w-full rounded-2xl bg-founder-600 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-founder-700"
              >
                Details ansehen
              </Link>
            </div>
          </article>
        );
      })}
      </div>
    </>
  );
}
