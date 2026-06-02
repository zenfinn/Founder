import Link from "next/link";
import { CockpitPage, CockpitPanel } from "@/components/cockpit/CockpitPage";
import { SEO } from "@/components/SEO";
import { RankTierCard } from "@/components/ranks/RankTierCard";
import { rankTiers } from "@/lib/rank-system";
import { buildFaqSchema, getPageMetadata, RANK_FAQS } from "@/lib/seo";

export const metadata = getPageMetadata("raenge");

const primaryRankIds = ["aspiring", "starter", "builder"];

export default function RaengePage() {
  const primaryTiers = rankTiers.filter((tier) => primaryRankIds.includes(tier.id));

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
          <Link
            href="/raenge/scaler"
            className="inline-flex px-5 py-3 text-sm font-semibold text-[#5b8cff] transition hover:text-[#1a3aad]"
          >
            Scaler & Elite →
          </Link>
        </div>

        {primaryTiers.map((tier) => (
          <CockpitPanel key={tier.id}>
            <RankTierCard tier={tier} variant="bento" />
          </CockpitPanel>
        ))}
      </CockpitPage>
    </>
  );
}
