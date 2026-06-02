import Link from "next/link";
import { CockpitPage, CockpitPanel } from "@/components/cockpit/CockpitPage";
import { PublicRankBadge } from "@/components/public/PublicRankBadge";
import { getRankTier, rankTiers } from "@/lib/rank-system";

export function generateStaticParams() {
  return rankTiers.map((tier) => ({ rank: tier.id }));
}

export function generateMetadata({ params }) {
  const tier = getRankTier(params.rank);
  return {
    title: `${tier.label} Rang`,
    description: `${tier.criteria} – ${tier.upload}`,
  };
}

export default function RankDetailPage({ params }) {
  const tier = getRankTier(params.rank);

  return (
    <CockpitPage>
      <Link href="/raenge" className="text-sm font-bold text-[#5b8cff]">
        Alle Ränge
      </Link>

      <CockpitPanel className="mt-4 overflow-hidden !p-0">
        <div className={`h-2 ${tier.accent}`} />
        <div className="p-6 sm:p-8">
          <PublicRankBadge rank={tier.id} size="lg" />
          <h1 className="mt-4 font-serif text-4xl font-bold tracking-tight text-white">{tier.label}</h1>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">Kriterium</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-neutral-200">{tier.criteria}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">Was du bekommst</p>
              <ul className="mt-2 space-y-1.5 text-sm leading-6 text-neutral-300">
                {tier.benefits.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">Was du hochlädst</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-neutral-200">{tier.upload}</p>
            </div>
          </div>

          {tier.mentorCap ? (
            <p className="mt-6 rounded-xl border border-[#1a3aad]/30 px-4 py-3 text-sm font-semibold text-[#5b8cff]">
              Als Mentor: max. {tier.mentorCap}€/Monat
            </p>
          ) : null}

          <Link
            href={`/register?rank=${tier.id}`}
            className="mt-6 inline-flex rounded-xl bg-[#1a3aad] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#2f61df]"
          >
            Jetzt bewerben
          </Link>
        </div>
      </CockpitPanel>
    </CockpitPage>
  );
}
