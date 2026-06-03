import Link from "next/link";
import Image from "next/image";
import { LandingHeader } from "@/components/LandingHeader";
import { SEO } from "@/components/SEO";
import { FadeIn, MotionCard } from "@/components/Motion";
import { LandingJoinCards } from "@/components/landing/LandingJoinCards";
import { RankBadge } from "@/components/RankBadge";
import { communityChannels, ranks, sampleEvents } from "@/lib/founder-data";
import {
  buildLocalBusinessSchema,
  buildOrganizationSchema,
  buildWebSiteSchema,
  getPageMetadata,
} from "@/lib/seo";
import {
  Bot,
  Coins,
  Crown,
  Flame,
  Gem,
  Globe,
  Package,
  ShoppingBag,
  Sprout,
  Store,
  TrendingUp,
  Video,
  Youtube,
  Zap,
} from "lucide-react";

export const metadata = getPageMetadata("home");

const rankIcons = {
  aspiring: Sprout,
  starter: Zap,
  builder: Flame,
  scaler: Gem,
  elite: Crown,
};

const groupIcons = {
  Reselling: ShoppingBag,
  Dropshipping: Package,
  "E-Commerce": Store,
  "Amazon FBA": Package,
  "TikTok Creator": Video,
  "TikTok Shop": ShoppingBag,
  "KI Creator": Bot,
  Trading: TrendingUp,
  "Memecoin Trading": Coins,
  "YouTube Automation": Youtube,
  "Digital Business": Globe,
};

const testimonials = [
  {
    name: "Jonas Weber",
    company: "Weber Commerce GmbH",
    quote: "Endlich eine Community, in der man sofort merkt, wer wirklich operativ baut.",
    rank: "scaler",
  },
  {
    name: "Nina Brandt",
    company: "CreatorFlow Studio",
    quote: "Die Mentor-Sessions und Events haben mir mehr gebracht als Monate in offenen Gruppen.",
    rank: "builder",
  },
  {
    name: "Emir Kaya",
    company: "Kaya Trading Systems",
    quote: "Verifizierte Ränge verändern die Gesprächsqualität komplett. Weniger Hype, mehr Substanz.",
    rank: "elite",
  },
];

function formatEventPrice(priceCents = 0) {
  if (!priceCents) return "Kostenlos";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(priceCents / 100);
}

function formatEventDate(value) {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <SEO jsonLd={[buildOrganizationSchema(), buildWebSiteSchema(), buildLocalBusinessSchema()]} />
      <LandingHeader />

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-20 text-center text-white">
        <Image
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1600&q=80"
          alt="Unternehmer arbeiten gemeinsam"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-slate-950/70" />
        <div className="relative z-10 mx-auto max-w-5xl">
          <p className="mx-auto mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-white backdrop-blur">
            FOUNDER COMMUNITY GERMANY
          </p>
          <h1 className="font-serif text-5xl font-bold tracking-tight sm:text-7xl">
            Gründer Community Deutschland – verifiziertes Unternehmer Netzwerk.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            Triff verifizierte Gründer, Builder und Scaler in Branchen-Communities wie Reselling, E-Commerce und Trading.
            Buche Mentoren, entdecke Events und wachse in Deutschlands Founder Community.
          </p>
          <div className="mt-9 flex flex-col items-center gap-3">
            <Link
              href="/login"
              className="w-full max-w-xs rounded-2xl bg-founder-600 px-7 py-4 text-center text-base font-bold text-white transition hover:bg-founder-700 sm:w-auto sm:min-w-[220px]"
            >
              Einloggen
            </Link>
            <div className="flex w-full max-w-md flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="rounded-2xl border border-white/70 bg-white/10 px-7 py-3.5 text-center text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                Kostenlos starten
              </Link>
              <Link
                href="/raenge"
                className="rounded-2xl border border-white/70 bg-white/10 px-7 py-3.5 text-center text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                So funktioniert es
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <FadeIn className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-600">Social Proof</p>
            <h2 className="mt-3 font-serif text-4xl font-bold text-slate-950">500+ verifizierte Unternehmer</h2>
          </FadeIn>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <MotionCard key={testimonial.name} className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
                <RankBadge rank={testimonial.rank} />
                <p className="mt-5 text-base leading-7 text-slate-700">&quot;{testimonial.quote}&quot;</p>
                <p className="mt-5 font-serif text-xl font-bold text-slate-950">{testimonial.name}</p>
                <p className="text-sm font-semibold text-slate-500">{testimonial.company}</p>
              </MotionCard>
            ))}
          </div>
        </div>
      </section>

      <section id="ranks" className="px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <FadeIn className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-600">Rang-System</p>
            <h2 className="mt-3 font-serif text-4xl font-bold text-slate-950">Zugang nach echter Unternehmensgröße.</h2>
          </FadeIn>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {ranks.map((rank) => {
              const Icon = rankIcons[rank.id] ?? Sprout;
              return (
                <MotionCard key={rank.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                  <Link href={`/raenge/${rank.id}`} className="block">
                    <Icon className="h-8 w-8 text-founder-600" />
                    <div className={`mt-5 h-2 w-14 rounded-full ${rank.accent}`} />
                    <h3 className="mt-5 font-serif text-2xl font-bold text-slate-950">{rank.label}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{rank.description}</p>
                    <p className="mt-4 text-sm font-bold text-founder-600">Details ansehen</p>
                  </Link>
                </MotionCard>
              );
            })}
          </div>
        </div>
      </section>

      <LandingJoinCards />

      <section id="events" className="px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-600">Events</p>
              <h2 className="mt-3 font-serif text-4xl font-bold text-slate-950">Live-Formate für echte Kontakte.</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Die Community bleibt frei. Tickets für Workshops, Dinner und Konferenzen sind die erste
                Haupt-Monetarisierung.
              </p>
            </div>
            <Link href="/events#vorschlagen" className="rounded-2xl bg-founder-600 px-5 py-3 text-center text-sm font-bold text-white">
              Event vorschlagen
            </Link>
          </div>
          <div className="relative mt-8">
            <div className="pointer-events-none grid gap-4 opacity-40 grayscale md:grid-cols-3">
              {sampleEvents.slice(0, 3).map((event) => (
                <MotionCard key={event.id} className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
                  <div className="relative h-44">
                    <Image src={event.image_url} alt="" fill className="object-cover" sizes="(min-width: 768px) 33vw, 100vw" />
                  </div>
                  <div className="p-5">
                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-founder-600">
                      {formatEventDate(event.starts_at)}
                    </p>
                    <h3 className="mt-5 font-serif text-2xl font-bold text-slate-950">{event.title}</h3>
                    <p className="mt-2 text-lg font-bold text-founder-600">{formatEventPrice(event.price_cents)}</p>
                  </div>
                </MotionCard>
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white/95 px-8 py-6 text-center shadow-lg backdrop-blur">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-600">Coming Soon</p>
                <p className="mt-2 font-serif text-2xl font-bold text-slate-950">Events starten bald</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="mentors" className="px-4 py-10">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-600">Mentoren</p>
            <h2 className="mt-3 font-serif text-4xl font-bold text-slate-950">Buche Erfahrung statt Theorie.</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Die Mentor-Liste wächst gerade. Bewirb dich als Mentor ab Builder-Rang.
            </p>
          </div>
          <div className="mt-8 rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-600">Coming Soon</p>
            <h3 className="mt-3 font-serif text-3xl font-bold text-slate-950">Erste Mentoren werden freigeschaltet</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
              Du hast Builder-Rang oder höher? Bewirb dich jetzt — nach Freigabe erscheinst du in der Liste.
            </p>
            <Link
              href="/mentoren#apply"
              className="mt-6 inline-flex rounded-2xl bg-founder-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-founder-700"
            >
              Als Mentor bewerben
            </Link>
          </div>
        </div>
      </section>

      <section id="community" className="px-4 py-10 pb-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-4xl font-bold text-slate-950">Deine Branche. Dein Netzwerk.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {communityChannels
              .filter((group) => !group.requires_founder_pro)
              .map((group) => {
                const Icon = groupIcons[group.category] ?? Globe;
                return (
                  <MotionCard key={group.slug} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                    <Icon className="h-8 w-8 text-founder-600" />
                    <h3 className="mt-4 font-serif text-2xl font-bold text-slate-950">{group.name}</h3>
                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      {group.member_count.toLocaleString("de-DE")} Mitglieder
                    </p>
                  </MotionCard>
                );
              })}
          </div>
        </div>
      </section>
    </main>
  );
}
