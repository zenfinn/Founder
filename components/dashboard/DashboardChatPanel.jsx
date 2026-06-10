"use client";

import Link from "next/link";
import { GroupChat } from "@/components/groups/GroupChat";
import { DashboardOnboardingSteps } from "@/components/DashboardOnboardingSteps";
import { useOnboardingStatus } from "@/components/dashboard/useOnboardingStatus";
import { Globe, Users } from "lucide-react";

export function DashboardChatPanel({
  loungeGroup,
  userId,
  profile,
  verificationStatus,
  communitiesCount,
  copy,
}) {
  const { complete: onboardingComplete, progress: onboardingProgress } = useOnboardingStatus({
    userId,
    profile,
    verificationStatus,
    communitiesCount,
  });

  const showOnboarding = !onboardingComplete && onboardingProgress < 100;

  return (
    <section className="flex min-h-[min(58dvh,520px)] flex-1 flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0a]/80 backdrop-blur-md lg:min-h-0">
      <header className="flex shrink-0 items-start justify-between gap-2 border-b border-white/[0.06] px-3 py-2.5 sm:items-center sm:gap-3 sm:px-4 sm:py-3 md:px-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 shrink-0 text-[#5b8cff]" />
            <h1 className="truncate font-serif text-base font-bold text-white sm:text-lg md:text-xl">
              {loungeGroup?.name ?? "Alle Gründer"}
            </h1>
          </div>
          <p className="mt-0.5 hidden truncate text-xs text-neutral-500 sm:block">
            {loungeGroup?.description ?? copy.liveChatHint}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-[#1a3aad]/40 bg-[#1a3aad]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5b8cff] sm:px-2.5 sm:py-1">
            Global
          </span>
          <span className="hidden items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium text-neutral-400 md:inline-flex">
            <Users className="h-3 w-3" />
            {loungeGroup?.member_count?.toLocaleString("de-DE") ?? "—"}
          </span>
          <Link
            href="/community"
            className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-semibold text-neutral-300 transition hover:border-[#1a3aad]/50 hover:text-white sm:px-2.5 sm:py-1.5 sm:text-[11px]"
          >
            Branchen
          </Link>
        </div>
      </header>

      {showOnboarding ? (
        <div className="shrink-0 border-b border-white/[0.06] px-3 py-2 sm:px-4 sm:py-3 md:px-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Nächste Schritte</p>
          <div className="max-h-28 overflow-y-auto sm:max-h-36 [&_*]:border-white/10 [&_.rounded-\\[2rem\\]]:rounded-xl [&_.bg-white]:bg-transparent [&_.text-slate-950]:text-white [&_.text-slate-600]:text-neutral-400 [&_.text-founder-600]:text-[#5b8cff]">
            <DashboardOnboardingSteps
              userId={userId}
              profile={profile}
              verificationStatus={verificationStatus}
              communitiesCount={communitiesCount}
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-2 md:px-5 md:pb-4">
        {loungeGroup?.id ? (
          <GroupChat groupId={loungeGroup.id} group={loungeGroup} variant="dashboard" />
        ) : (
          <p className="py-12 text-center text-sm text-neutral-500">{copy.loading}</p>
        )}
      </div>
    </section>
  );
}
