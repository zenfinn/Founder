import Link from "next/link";
import { CockpitPage, CockpitPanel } from "@/components/cockpit/CockpitPage";
import { SEO } from "@/components/SEO";
import { RankTierCard } from "@/components/ranks/RankTierCard";
import { rankTiers } from "@/lib/rank-system";
import { buildFaqSchema, getPageMetadata, RANK_FAQS } from "@/lib/seo";

export const metadata = getPageMetadata("raenge");

export default function RaengePage() {
  return (
    <>
      <SEO jsonLd={buildFaqSchema(RANK_FAQS)} />
      <CockpitPage
        eyebrow="Ränge"
        title="Rang-System: Aspiring bis Elite"
        description="Registrieren reicht für den Start. Jeder höhere Rang braucht genau ein Nachweis-Dokument — transparent für verifizierte Gründer."
      >
        <CockpitPanel className="flex flex-wrap gap-3">
          <Link href="/register?rank=aspiring" className="inline-flex rounded-xl bg-[#1a3aad] px-6 py-3 text-sm font-bold text-white">
            Kostenlos starten
          </Link>
        </CockpitPanel>
        <div className="space-y-4">
          {rankTiers.map((tier) => (
            <RankTierCard key={tier.id} tier={tier} />
          ))}
        </div>
      </CockpitPage>
    </>
  );
}
