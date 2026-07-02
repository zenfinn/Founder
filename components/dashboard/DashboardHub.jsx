"use client";

import { FounderProIntentHandler } from "@/components/FounderProIntentHandler";
import { FounderProUpgradeButton } from "@/components/FounderProUpgradeButton";
import { DashboardChatPanel } from "@/components/dashboard/DashboardChatPanel";
import { DashboardLanguageSwitcher } from "@/components/dashboard/DashboardLanguageSwitcher";
import { DashboardSideRail } from "@/components/dashboard/DashboardSideRail";
import { DashboardWidgets } from "@/components/dashboard/DashboardWidgets";
import { useDashboardLocale } from "@/components/dashboard/useDashboardLocale";
import { isFounderPro } from "@/lib/membership";

export function DashboardHub({
  profile,
  userId,
  verificationStatus,
  communities,
  mentors,
  loungeGroup,
  resourcePreview,
  loading,
}) {
  const { locale, setLocale, copy } = useDashboardLocale("de");
  const proMember = isFounderPro(profile);

  return (
    <>
      <FounderProIntentHandler />

      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-4 md:gap-4 md:px-6 lg:h-[calc(100dvh-8rem)] lg:min-h-0">
        {!proMember && (
          <div className="flex shrink-0 flex-col gap-3 rounded-xl border border-[#1a3aad]/35 bg-[#1a3aad]/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">{copy.proUpgradeTitle}</p>
              <p className="mt-0.5 text-xs text-neutral-400">{copy.proUpgradeHint}</p>
            </div>
            <FounderProUpgradeButton
              label={copy.proUpgradeCta}
              cancelPath="/dashboard"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#1a3aad] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#2f61df] disabled:cursor-not-allowed disabled:opacity-70"
              errorClassName="text-xs font-semibold text-red-400"
            />
          </div>
        )}

        <div className="flex shrink-0 items-center justify-between gap-3">
          <p className="hidden text-sm font-medium text-neutral-500 lg:block">
            {loading ? copy.loading : "Community-Chat"}
          </p>
          <div className="ml-auto">
            <DashboardLanguageSwitcher locale={locale} onChange={setLocale} />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-6">
          <div className="hidden shrink-0 lg:block lg:pt-1">
            <DashboardSideRail profile={profile} copy={copy} />
          </div>

          <div className="flex h-[calc(100dvh-7.5rem)] min-h-[400px] flex-col lg:h-auto lg:min-h-0 lg:flex-1">
            <DashboardChatPanel
              loungeGroup={loungeGroup}
              userId={userId}
              profile={profile}
              verificationStatus={verificationStatus}
              communitiesCount={communities.length}
              copy={copy}
            />
          </div>

          <div className="hidden min-h-0 shrink-0 overflow-y-auto lg:block lg:pt-1">
            <DashboardWidgets
              copy={copy}
              communities={communities}
              mentors={mentors}
              resourcePreview={resourcePreview}
              loungeGroup={loungeGroup}
            />
          </div>
        </div>
      </div>
    </>
  );
}
