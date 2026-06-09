import Link from "next/link";
import { LandingHeader } from "@/components/LandingHeader";
import { SEO } from "@/components/SEO";
import { LandingJoinCards } from "@/components/landing/LandingJoinCards";
import { LandingShell } from "@/components/landing/LandingShell";
import { RankBadge } from "@/components/RankBadge";
import { communityChannels, ranks } from "@/lib/founder-data";
import {
  buildLocalBusinessSchema,
  buildOrganizationSchema,
  buildWebSiteSchema,
  getPageMetadata,
} from "@/lib/seo";
import { CommunityCategoryIcon } from "@/components/community/CommunityCategoryIcon";
import { ArrowUpRight, Crown, Flame, Gem, Sprout, Zap } from "lucide-react";

export const metadata = getPageMetadata("home");

const rankIcons = {
  aspiring: Sprout,
  starter: Zap,
  builder: Flame,
  scaler: Gem,
  elite: Crown,
};

export default function LandingPage() {
  return (
    <LandingShell>
      <SEO jsonLd={[buildOrganizationSchema(), buildWebSiteSchema(), buildLocalBusinessSchema()]} />
      <LandingHeader />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 md:px-6">
        <section className="rounded-xl border border-[#1a3aad]/30 bg-[#0f0f0f]/80 p-6 md:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#1a3aad]">
            Founder Community Germany
          </p>
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Verifiziertes Unternehmer-Netzwerk für Gründer in Deutschland.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-400 sm:text-base">
            Branchen-Communities, Mentoren und Ressourcen — mit Rang-System statt Hype.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-xl bg-[#1a3aad] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#2f61df]"
            >
              Kostenlos starten
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-[#1a3aad]/40 px-6 py-3.5 text-sm font-bold text-neutral-200 transition hover:border-[#1a3aad]"
            >
              Einloggen
            </Link>
            <Link
              href="/raenge"
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-[#1a3aad]/40 px-6 py-3.5 text-sm font-bold text-[#1a3aad] transition hover:border-[#1a3aad]"
            >
              Ränge ansehen
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <LandingJoinCards />

        <section id="community" className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#1a3aad]">Communities</p>
              <h2 className="mt-2 font-serif text-2xl font-bold text-white">Deine Branche. Dein Netzwerk.</h2>
            </div>
            <Link href="/community" className="text-xs font-bold text-[#1a3aad] hover:text-[#2f61df]">
              Alle ansehen
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {communityChannels
              .filter((group) => !group.requires_founder_pro)
              .slice(0, 6)
              .map((group) => (
                <Link
                  key={group.slug}
                  href="/community"
                  className="rounded-xl border border-[#1a3aad]/25 bg-[#0f0f0f] p-4 transition hover:border-[#1a3aad]/60"
                >
                  <CommunityCategoryIcon category={group.category} className="h-6 w-6 text-[#1a3aad]" />
                  <h3 className="mt-3 font-serif text-lg font-bold text-white">{group.name}</h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    {group.member_count.toLocaleString("de-DE")} Mitglieder
                  </p>
                </Link>
              ))}
          </div>
        </section>

        <section id="ranks" className="mt-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#1a3aad]">Rang-System</p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-white">Zugang nach echter Unternehmensgröße.</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {ranks.map((rank) => {
              const Icon = rankIcons[rank.id] ?? Sprout;
              return (
                <Link
                  key={rank.id}
                  href={`/raenge/${rank.id}`}
                  className="rounded-xl border border-[#1a3aad]/25 bg-[#0f0f0f] p-4 transition hover:border-[#1a3aad]/60"
                >
                  <Icon className="h-6 w-6 text-[#1a3aad]" />
                  <h3 className="mt-3 font-serif text-lg font-bold text-white">{rank.label}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-500">{rank.description}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-[#1a3aad]/30 bg-[#0f0f0f] p-5">
          <div className="flex flex-wrap items-center gap-3">
            <RankBadge rank="scaler" />
            <p className="text-sm text-neutral-400">
              &ldquo;Endlich eine Community, in der man sofort merkt, wer wirklich operativ baut.&rdquo;
            </p>
          </div>
          <p className="mt-3 text-sm font-semibold text-white">Jonas Weber · Weber Commerce GmbH</p>
        </section>
      </main>
    </LandingShell>
  );
}
