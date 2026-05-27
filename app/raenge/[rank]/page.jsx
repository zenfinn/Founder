import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
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
    <main className="min-h-screen bg-slate-50">
      <AppHeader active="/raenge" />
      <section className="px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <Link href="/raenge" className="text-sm font-bold text-founder-600">
            Alle Ränge
          </Link>

          <article className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
            <div className={`h-2 ${tier.accent}`} />
            <div className="p-6 sm:p-8">
              <PublicRankBadge rank={tier.id} size="lg" />
              <h1 className="mt-4 font-serif text-4xl font-bold tracking-tight text-slate-950">{tier.label}</h1>

              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Kriterium</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{tier.criteria}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Was du bekommst</p>
                  <ul className="mt-2 space-y-1.5 text-sm leading-6 text-slate-700">
                    {tier.benefits.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Was du hochlädst</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{tier.upload}</p>
                </div>
              </div>

              {tier.mentorCap ? (
                <p className="mt-6 rounded-2xl bg-founder-50 px-4 py-3 text-sm font-semibold text-founder-800">
                  Als Mentor: max. {tier.mentorCap}€/Stunde
                </p>
              ) : null}

              <Link
                href={`/register?rank=${tier.id}`}
                className="mt-6 inline-flex rounded-2xl bg-founder-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-founder-700"
              >
                Jetzt bewerben
              </Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
