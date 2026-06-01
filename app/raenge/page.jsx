import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SEO } from "@/components/SEO";
import { PageHero } from "@/components/PageHero";
import { RankTierCard } from "@/components/ranks/RankTierCard";
import { rankTiers } from "@/lib/rank-system";
import { buildFaqSchema, getPageMetadata, RANK_FAQS } from "@/lib/seo";

export const metadata = getPageMetadata("raenge");

export default function RaengePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <SEO jsonLd={buildFaqSchema(RANK_FAQS)} />
      <AppHeader active="/raenge" />
      <PageHero
        eyebrow="Ränge"
        title="Rang-System: Aspiring bis Elite im Unternehmer Netzwerk"
        description="Registrieren reicht für den Start. Jeder höhere Rang braucht genau ein Nachweis-Dokument – transparent für verifizierte Gründer in Deutschland."
        imageUrl="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1600&q=80"
        imageAlt="Unternehmer Rang-System Founder Community"
      >
        <Link href="/register?rank=aspiring" className="inline-flex rounded-2xl bg-founder-600 px-6 py-4 text-sm font-bold text-white">
          Kostenlos starten
        </Link>
      </PageHero>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumbs items={[{ name: "Ränge", href: "/raenge" }]} />
          <div className="space-y-5">
          {rankTiers.map((tier) => (
            <RankTierCard key={tier.id} tier={tier} />
          ))}
          </div>
        </div>
      </section>
    </main>
  );
}
