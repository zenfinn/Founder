"use client";

import Link from "next/link";
import { FounderProIntentHandler } from "@/components/FounderProIntentHandler";
import { FeedAvatar } from "@/components/FeedAvatar";
import { RankBadge } from "@/components/RankBadge";
import { DashboardOnboardingSteps } from "@/components/DashboardOnboardingSteps";
import { BentoTile } from "@/components/dashboard/BentoTile";
import { DashboardLanguageSwitcher } from "@/components/dashboard/DashboardLanguageSwitcher";
import { PrioritySignalsWidget } from "@/components/dashboard/PrioritySignalsWidget";
import { useDashboardLocale } from "@/components/dashboard/useDashboardLocale";
import { useOnboardingStatus } from "@/components/dashboard/useOnboardingStatus";
import { getProfileWelcomeName, isFounderPro } from "@/lib/membership";
import { CommunityCategoryIcon } from "@/components/community/CommunityCategoryIcon";
import { getDashboardMainCategories } from "@/lib/community-categories";
import {
  ArrowUpRight,
  LayoutGrid,
  MessageSquare,
  Radio,
  UserRound,
} from "lucide-react";

function TileLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
      <Icon className="h-3 w-3 text-[#1a3aad]" strokeWidth={2} />
      {children}
    </div>
  );
}

function QuickLinkCard({ href, icon: Icon, title, subtitle, action }) {
  return (
    <Link
      href={href}
      className="flex min-w-[9.5rem] shrink-0 snap-start flex-col rounded-xl border border-[#1a3aad]/25 bg-[#0f0f0f] p-3 transition hover:border-[#1a3aad]/60"
    >
      <TileLabel icon={Icon}>{title}</TileLabel>
      <p className="mt-2 line-clamp-2 text-xs leading-4 text-neutral-400">{subtitle}</p>
      <span className="mt-2 inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#1a3aad]">
        {action}
        <ArrowUpRight className="h-3 w-3" />
      </span>
    </Link>
  );
}

function CategoryQuickLinkCard({ href, category, title, subtitle, action }) {
  return (
    <Link
      href={href}
      className="flex min-w-[8.75rem] shrink-0 snap-start flex-col rounded-xl border border-[#1a3aad]/25 bg-[#0f0f0f] p-3 transition hover:border-[#1a3aad]/60"
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        <CommunityCategoryIcon category={category} className="h-3 w-3 text-[#1a3aad]" strokeWidth={2} />
        {title}
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-4 text-neutral-400">{subtitle}</p>
      <span className="mt-2 inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#1a3aad]">
        {action}
        <ArrowUpRight className="h-3 w-3" />
      </span>
    </Link>
  );
}

export function DashboardBento({
  profile,
  userId,
  verificationStatus,
  posts,
  communities,
  mentors,
  loading,
}) {
  const { locale, setLocale, copy } = useDashboardLocale("de");

  const welcomeName = getProfileWelcomeName(profile);
  const currentRank = profile?.current_rank ?? "aspiring";
  const proMember = isFounderPro(profile);
  const primaryCommunity = communities[0];
  const nextMentor = mentors[0];
  const { progress: onboardingProgress, complete: onboardingComplete } = useOnboardingStatus({
    userId,
    profile,
    verificationStatus,
    communitiesCount: communities.length,
  });
  const communityGroupIds = communities.map((group) => group.id);

  const mainCategories = getDashboardMainCategories();

  const mentoringSubtitle = nextMentor
    ? (nextMentor.mentor_name ?? copy.mentoring)
    : copy.mentoringEmpty;

  return (
    <>
      <FounderProIntentHandler />

      <div className="mx-auto max-w-7xl px-4 pb-4 pt-1 md:px-6">
        <header className="mb-3 flex items-center gap-3">
          <FeedAvatar
            name={profile?.display_name ?? welcomeName}
            avatarUrl={profile?.avatar_url ?? ""}
            size={44}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{welcomeName}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <RankBadge rank={currentRank} />
              <span className="rounded-full border border-[#1a3aad]/35 px-2 py-0.5 text-[10px] font-semibold text-neutral-300">
                {proMember ? copy.founderPro : copy.basic}
              </span>
            </div>
          </div>
          <DashboardLanguageSwitcher locale={locale} onChange={setLocale} />
        </header>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {mainCategories.map((category) => {
            const joinedGroup = communities.find((group) => group.slug === category.slug);
            return (
              <CategoryQuickLinkCard
                key={category.slug}
                href={joinedGroup ? `/community/${joinedGroup.id}` : "/community"}
                category={category.category}
                title={copy.categories[category.slug] ?? category.name}
                subtitle={category.description}
                action={copy.categoryExplore}
              />
            );
          })}
          <QuickLinkCard
            href="/showcases"
            icon={LayoutGrid}
            title={copy.showcase}
            subtitle={copy.showcaseHint}
            action={copy.discoverShowcases}
          />
          <QuickLinkCard
            href={nextMentor?.mentor_key ? `/mentoren/${nextMentor.mentor_key}` : "/mentoren"}
            icon={UserRound}
            title={copy.mentoring}
            subtitle={mentoringSubtitle}
            action={nextMentor ? copy.viewSession : copy.findMentor}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <BentoTile compact delay={0.04} className="min-h-[220px] md:min-h-[280px]">
            <TileLabel icon={MessageSquare}>{copy.liveChat}</TileLabel>
            <p className="mt-1.5 text-xs text-neutral-500">{copy.liveChatHint}</p>
            <div className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto">
              {loading ? (
                <p className="text-xs text-neutral-500">{copy.loading}</p>
              ) : (
                posts.slice(0, 2).map((post) => (
                  <div key={post.id} className="rounded-lg border border-[#1a3aad]/20 p-2.5">
                    <div className="flex items-start gap-2">
                      <FeedAvatar name={post.author} avatarUrl={post.avatarUrl} size={28} />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-white">{post.author}</p>
                        <p className="mt-0.5 line-clamp-1 text-[11px] leading-4 text-neutral-400">{post.text}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link
              href={primaryCommunity ? `/community/${primaryCommunity.id}` : "/community"}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1a3aad] transition hover:text-[#2f61df]"
            >
              {copy.openChat}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </BentoTile>

          <BentoTile compact delay={0.08} className="min-h-[220px] md:min-h-[280px]">
            {onboardingComplete || onboardingProgress >= 100 ? (
              <PrioritySignalsWidget
                embedded
                userId={userId}
                communityGroupIds={communityGroupIds}
                copy={copy}
              />
            ) : (
              <>
                <TileLabel icon={Radio}>{copy.prioritySignals}</TileLabel>
                <div className="mt-2 min-h-0 flex-1 overflow-y-auto [&_*]:border-[#1a3aad]/25 [&_.rounded-\\[2rem\\]]:rounded-xl [&_.bg-white]:bg-[#141414] [&_.text-slate-950]:text-white [&_.text-slate-600]:text-neutral-400 [&_.text-slate-500]:text-neutral-500 [&_.text-founder-600]:text-[#1a3aad] [&_.bg-founder-600]:bg-[#1a3aad] [&_.border-slate-200]:border-[#1a3aad]/25">
                  <DashboardOnboardingSteps
                    userId={userId}
                    profile={profile}
                    verificationStatus={verificationStatus}
                    communitiesCount={communities.length}
                  />
                </div>
              </>
            )}
          </BentoTile>
        </div>
      </div>
    </>
  );
}
