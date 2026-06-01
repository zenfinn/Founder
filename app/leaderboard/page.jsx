import Image from "next/image";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PublicRankBadge } from "@/components/public/PublicRankBadge";
import { getProfileInitial } from "@/lib/profiles";
import { getPageMetadata } from "@/lib/seo";
import { createPublicSupabaseClient, fetchActivityLeaderboard, getISOWeekLabel } from "@/lib/public-profile";

export const dynamic = "force-dynamic";

export const metadata = getPageMetadata("leaderboard");

export default async function LeaderboardPage() {
  const supabase = createPublicSupabaseClient();
  let entries = [];

  try {
    entries = await fetchActivityLeaderboard(supabase, 20);
  } catch (error) {
    console.error("leaderboard fetch failed", error);
  }

  const { week, year } = getISOWeekLabel();

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto max-w-3xl">
          <Link href="/">
            <BrandMark />
          </Link>
        </div>
      </header>

      <section className="px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <Breadcrumbs items={[{ name: "Leaderboard", href: "/leaderboard" }]} />
          <div className="rounded-[2rem] bg-founder-600 px-6 py-8 text-center text-white shadow-soft">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-100">Founder Leaderboard</p>
            <h1 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">
              Die aktivsten Unternehmer – Woche {week}/{year}
            </h1>
            <p className="mt-3 text-sm text-founder-100">Top 20 nach Community-Aktivitäts-Score</p>
          </div>

          <ol className="mt-8 space-y-3">
            {entries.length === 0 ? (
              <li className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-slate-500">
                Noch keine Aktivität – sei der Erste in der Community!
              </li>
            ) : (
              entries.map((entry, index) => {
                const initial = getProfileInitial({ display_name: entry.display_name });
                const profileHref = entry.username ? `/u/${entry.username}` : null;

                return (
                  <li
                    key={entry.user_id}
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-founder-50 text-sm font-bold text-founder-700">
                      {index + 1}
                    </span>

                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-founder-600 font-serif text-lg font-bold text-white">
                      {entry.avatar_url ? (
                        <Image src={entry.avatar_url} alt="" fill className="object-cover" unoptimized />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center">{initial}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      {profileHref ? (
                        <Link href={profileHref} className="truncate font-semibold text-slate-900 hover:text-founder-600">
                          {entry.display_name}
                        </Link>
                      ) : (
                        <p className="truncate font-semibold text-slate-900">{entry.display_name}</p>
                      )}
                      <div className="mt-1">
                        <PublicRankBadge rank={entry.current_rank ?? "aspiring"} size="sm" />
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-lg font-bold text-slate-900">{entry.score}</p>
                      <p className="text-xs font-medium text-slate-400">Score</p>
                    </div>
                  </li>
                );
              })
            )}
          </ol>

          <div className="mt-10 rounded-2xl border border-founder-200 bg-founder-50 px-6 py-8 text-center">
            <p className="text-base font-semibold text-slate-700">Du willst auch dabei sein?</p>
            <Link
              href="/register"
              className="mt-4 inline-flex items-center justify-center rounded-2xl bg-founder-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-founder-700"
            >
              Kostenlos beitreten
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
