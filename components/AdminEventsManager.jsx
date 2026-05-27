"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const emptyEvent = {
  title: "",
  slug: "",
  description: "",
  starts_at: "",
  location_text: "Online",
  price_cents: 0,
  capacity: 50,
  status: "published",
};

export function AdminEventsManager() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState(emptyEvent);
  const [message, setMessage] = useState("");

  async function load() {
    const [{ data: eventRows, error: eventsError }, { data: ticketRows, error: ticketsError }] = await Promise.all([
      supabase.from("events").select("id,title,slug,starts_at,status,price_cents,capacity").order("starts_at", { ascending: false }),
      supabase.from("event_tickets").select("event_id,event_key,status,amount_cents"),
    ]);

    if (eventsError || ticketsError) {
      setMessage(eventsError?.message ?? ticketsError?.message ?? "Fehler beim Laden.");
      return;
    }

    setEvents(eventRows ?? []);
    setTickets(ticketRows ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createEvent(event) {
    event.preventDefault();
    setMessage("");

    const { error } = await supabase.from("events").insert({
      ...form,
      price_cents: Number(form.price_cents) || 0,
      capacity: Number(form.capacity) || null,
      starts_at: new Date(form.starts_at).toISOString(),
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setForm(emptyEvent);
    await load();
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
      <form onSubmit={createEvent} className="rounded-[2rem] border border-slate-200 bg-white p-5">
        <h2 className="font-serif text-2xl font-bold text-slate-950">Event erstellen</h2>
        <div className="mt-5 space-y-3">
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Titel" required />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="slug" required />
          <textarea className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Beschreibung" />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} required />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.location_text} onChange={(e) => setForm({ ...form, location_text: e.target.value })} placeholder="Ort" />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="number" value={form.price_cents} onChange={(e) => setForm({ ...form, price_cents: e.target.value })} placeholder="Preis in Cent" />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="Kapazität" />
        </div>
        {message && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p>}
        <button className="mt-5 w-full rounded-2xl bg-founder-600 px-5 py-3 font-bold text-white" type="submit">Speichern</button>
      </form>

      <section className="space-y-3">
        {events.map((item) => {
          const eventTickets = tickets.filter((ticket) => ticket.event_id === item.id);
          const revenue = eventTickets.reduce((sum, ticket) => sum + (ticket.status === "paid" ? ticket.amount_cents ?? 0 : 0), 0);
          return (
            <article key={item.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-founder-600">{item.status}</p>
              <h3 className="mt-2 font-serif text-2xl font-bold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.starts_at))}</p>
              <p className="mt-3 text-sm font-semibold text-slate-700">{eventTickets.length} Tickets · {new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(revenue / 100)}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
