"use client";

import { FounderProIntentHandler } from "@/components/FounderProIntentHandler";
import { DashboardChatPanel } from "@/components/dashboard/DashboardChatPanel";
import { DashboardLanguageSwitcher } from "@/components/dashboard/DashboardLanguageSwitcher";
import { DashboardSideRail } from "@/components/dashboard/DashboardSideRail";
import { DashboardWidgets } from "@/components/dashboard/DashboardWidgets";
import { useDashboardLocale } from "@/components/dashboard/useDashboardLocale";

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

  const chatProps = {
    loungeGroup,
    userId,
    profile,
    verificationStatus,
    communitiesCount: communities.length,
    copy,
  };

  const widgetProps = {
    copy,
    communities,
    mentors,
    resourcePreview,
    loungeGroup,
  };

  return (
    <>
      <FounderProIntentHandler />

      {/* Mobile: nur globaler Chat */}
      <div className="flex h-[calc(100dvh-7.25rem)] min-h-[420px] flex-col gap-2 px-4 lg:hidden">
        <div className="flex shrink-0 items-center justify-end">
          <DashboardLanguageSwitcher locale={locale} onChange={setLocale} />
        </div>
        <div className="min-h-0 flex-1">
          <DashboardChatPanel {...chatProps} />
        </div>
      </div>

      {/* Desktop: Sidebar + Chat + Widgets */}
      <div className="mx-auto hidden w-full max-w-[1440px] flex-col gap-4 px-6 lg:flex lg:h-[calc(100dvh-8rem)] lg:min-h-0">
        <div className="flex shrink-0 items-center justify-between gap-3">
          <p className="text-sm font-medium text-neutral-500">
            {loading ? copy.loading : "Community-Chat"}
          </p>
          <DashboardLanguageSwitcher locale={locale} onChange={setLocale} />
        </div>

        <div className="flex min-h-0 flex-1 gap-6">
          <div className="shrink-0 pt-1">
            <DashboardSideRail profile={profile} copy={copy} />
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <DashboardChatPanel {...chatProps} />
          </div>

          <div className="min-h-0 shrink-0 overflow-y-auto pt-1">
            <DashboardWidgets {...widgetProps} />
          </div>
        </div>
      </div>
    </>
  );
}
