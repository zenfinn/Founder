import Image from "next/image";
import Link from "next/link";
import { CockpitPage, CockpitPanel } from "@/components/cockpit/CockpitPage";
import { PublicRankBadge } from "@/components/public/PublicRankBadge";
import { getProfileInitial } from "@/lib/profiles";
import { getPageMetadata } from "@/lib/seo";
import { createPublicSupabaseClient, fetchActivityLeaderboard, getISOWeekLabel } from "@/lib/public-profile";

export const dynamic = "force-dynamic";

export const metadata = getPageMetadata("leaderboard");

export default async function LeaderboardPage() {
  const supabase = createPublicSupabaseClient();
  const entries = await fetchActivityLeaderboard(supabase, 20);
  const { week, year } = getISOWeekLabel();

  return (
    <CockpitPage
      eyebrow="Leaderboard"
      title={`Die aktivsten Unternehmer — Woche ${week}/${year}`}
      description="Top 20 nach Community-Aktivitäts-Score."
    >
      <CockpitPanel>
        <ol className="space-y-3">
          {entries.map((entry, index) => {
            const initial = getProfileInitial({ display_name: entry.display_name });
            const profileHref = entry.username ? `/u/${entry.username}` : null;

            return (
              <li
                key={entry.user_id}
                className="flex items-center gap-4 rounded-xl border border-[#1a3aad]/20 px-4 py-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#1a3aad]/30 text-sm font-bold text-[#5b8cff]">
                  {index + 1}
                </span>

                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#1a3aad] font-serif text-lg font-bold text-white">
                  {entry.avatar_url ? (
                    <Image src={entry.avatar_url} alt="" fill className="object-cover" unoptimized />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">{initial}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  {profileHref ? (
                    <Link href={profileHref} className="truncate font-semibold text-white hover:text-[#5b8cff]">
                      {entry.display_name}
                    </Link>
                  ) : (
                    <p className="truncate font-semibold text-white">{entry.display_name}</p>
                  )}
                  <div className="mt-1">
                    <PublicRankBadge rank={entry.current_rank ?? "aspiring"} size="sm" />
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold text-white">{entry.score}</p>
                  <p className="text-xs font-medium text-neutral-500">Score</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-8 rounded-xl border border-[#1a3aad]/30 px-6 py-8 text-center">
          <p className="text-base font-semibold text-neutral-300">Du willst auch dabei sein?</p>
          <Link
            href="/register"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#1a3aad] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#2f61df]"
          >
            Kostenlos beitreten
          </Link>
        </div>
      </CockpitPanel>
    </CockpitPage>
  );
}
