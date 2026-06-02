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
        <div className="flex flex-wrap justify-end gap-2">
          <Link
            href="/register?rank=aspiring"
            className="inline-flex bg-[#1a3aad] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#2f61df]"
          >
            Kostenlos starten
          </Link>
        </div>

        {rankTiers.map((tier) => (
          <CockpitPanel key={tier.id}>
            <RankTierCard tier={tier} variant="bento" />
          </CockpitPanel>
        ))}
      </CockpitPage>
    </>
  );
}
