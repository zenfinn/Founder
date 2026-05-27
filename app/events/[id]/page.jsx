import Link from "next/link";
import Image from "next/image";
import { AppHeader } from "@/components/AppHeader";
import { RankBadge } from "@/components/RankBadge";
import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";
import { sampleEvents } from "@/lib/founder-data";
import { CalendarDays, MapPin, Users } from "lucide-react";

function formatPrice(priceCents = 0) {
  if (!priceCents) return "Kostenlos";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(priceCents / 100);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "full", timeStyle: "short" }).format(new Date(value));
}

export function generateMetadata({ params }) {
  const event = sampleEvents.find((item) => item.slug === params.id || item.id === params.id) ?? sampleEvents[0];
  return {
    title: event.title,
    description: event.description,
  };
}

export default function EventDetailPage({ params }) {
  const event = sampleEvents.find((item) => item.slug === params.id || item.id === params.id) ?? sampleEvents[0];
  const spotsLeft = Math.max((event.capacity ?? 0) - (event.booked_spots ?? 0), 0);
  const bookedPercent = event.capacity ? Math.min(100, Math.round(((event.booked_spots ?? 0) / event.capacity) * 100)) : 0;
  const relatedEvents = sampleEvents.filter((item) => item.id !== event.id).slice(0, 2);

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader active="/events" />
      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <Link href="/events" className="text-sm font-bold text-founder-600">
            Zurück zu Events
          </Link>
          <div className="mt-6 overflow-hidden rounded-[2rem] border border-slate-200 bg-white">
            <div className="relative h-[420px]">
              <Image src={event.image_url} alt="" fill priority className="object-cover" sizes="100vw" />
              <div className="absolute inset-0 bg-slate-950/45" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white sm:p-10">
                <div className="flex flex-wrap gap-3">
                  <RankBadge rank={event.min_rank} />
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                    {event.group_label ?? "Für alle"}
                  </span>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                    {event.category}
                  </span>
                </div>
                <h1 className="mt-5 max-w-4xl font-serif text-5xl font-bold tracking-tight sm:text-6xl">{event.title}</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-100">{event.long_description ?? event.description}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            <article className="rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <CalendarDays className="h-5 w-5 text-founder-600" />
                  <p className="mt-3 text-sm font-bold text-slate-500">Datum & Uhrzeit</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{formatDate(event.starts_at)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <MapPin className="h-5 w-5 text-founder-600" />
                  <p className="mt-3 text-sm font-bold text-slate-500">Ort</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{event.location_text}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <Users className="h-5 w-5 text-founder-600" />
                  <p className="mt-3 text-sm font-bold text-slate-500">Verfügbare Plätze</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {spotsLeft} von {event.capacity} Plätzen frei
                  </p>
                  <div className="mt-3 h-2 rounded-full bg-slate-200">
                    <div className="h-2 rounded-full bg-founder-600" style={{ width: `${bookedPercent}%` }} />
                  </div>
                </div>
              </div>

              <h2 className="mt-10 font-serif text-3xl font-bold text-slate-950">Referenten</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {(event.speakers ?? []).map((speaker) => (
                  <article key={speaker.name} className="rounded-[1.5rem] bg-slate-50 p-4">
                    <div className="relative h-20 w-20 overflow-hidden rounded-full">
                      <Image src={speaker.image_url} alt="" fill className="object-cover" sizes="80px" />
                    </div>
                    <h3 className="mt-4 font-serif text-2xl font-bold text-slate-950">{speaker.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{speaker.bio}</p>
                  </article>
                ))}
              </div>

              <h2 className="mt-10 font-serif text-3xl font-bold text-slate-950">Agenda</h2>
              <div className="mt-5 space-y-3">
                {(event.agenda ?? []).map((item, index) => (
                  <div key={item} className="flex gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-founder-600 text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm font-semibold text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </article>

            <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-600">Ticket</p>
              <p className="mt-3 font-serif text-4xl font-bold text-slate-950">{formatPrice(event.price_cents)}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Direkte Buchung über Stripe Checkout. Zugang abhängig vom erforderlichen Rang.
              </p>
              <StripeCheckoutButton
                payload={{
                  type: "event_ticket",
                  event_id: event.id,
                  title: event.title,
                  amount_cents: event.price_cents,
                  cancel_path: `/events/${event.slug}`,
                }}
                className="mt-6 w-full rounded-2xl bg-founder-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-founder-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {event.price_cents ? "Ticket kaufen" : "Kostenlos buchen"}
              </StripeCheckoutButton>
            </aside>
          </div>

          <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6">
            <h2 className="font-serif text-3xl font-bold text-slate-950">Ähnliche Events</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {relatedEvents.map((item) => (
                <Link key={item.id} href={`/events/${item.slug}`} className="rounded-[1.5rem] bg-slate-50 p-4">
                  <p className="text-sm font-bold text-founder-600">{item.category}</p>
                  <h3 className="mt-2 font-serif text-2xl font-bold text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{formatDate(item.starts_at)}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
