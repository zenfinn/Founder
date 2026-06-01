import Link from "next/link";
import { PublicRankBadge } from "@/components/public/PublicRankBadge";

export function RankTierCard({ tier }) {
  return (
    <article className={`flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white ring-1 ${tier.ring}`}>
      <div className={`h-1.5 ${tier.accent}`} />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PublicRankBadge rank={tier.id} size="lg" />
          {tier.mentorCap ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              Mentor max. {tier.mentorCap}€/Monat
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">Kein Mentoring</span>
          )}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
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

        <Link
          href={`/register?rank=${tier.id}`}
          className="mt-auto inline-flex w-full items-center justify-center rounded-2xl bg-founder-600 px-5 py-3.5 pt-6 text-sm font-bold text-white transition hover:bg-founder-700 sm:w-auto"
        >
          Jetzt bewerben
        </Link>
      </div>
    </article>
  );
}
