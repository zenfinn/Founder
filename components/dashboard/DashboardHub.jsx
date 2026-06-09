"use client";

import Link from "next/link";
import { FounderProIntentHandler } from "@/components/FounderProIntentHandler";
import { DashboardChatPanel } from "@/components/dashboard/DashboardChatPanel";
import { DashboardLanguageSwitcher } from "@/components/dashboard/DashboardLanguageSwitcher";
import { DashboardMobileWidgets } from "@/components/dashboard/DashboardWidgets";
import { DashboardSideRail } from "@/components/dashboard/DashboardSideRail";
import { DashboardWidgets } from "@/components/dashboard/DashboardWidgets";
import { useDashboardLocale } from "@/components/dashboard/useDashboardLocale";

export function DashboardHub({
  profile,
  userId,
  verificationStatus,
  communities,
  mentors,
  subgroups,
  loungeGroup,
  resourcePreview,
  loading,
}) {
  const { locale, setLocale, copy } = useDashboardLocale("de");

  return (
    <>
      <FounderProIntentHandler />

      <div className="mx-auto flex h-[calc(100dvh-7.5rem)] max-w-[1440px] flex-col gap-4 px-4 pb-2 md:px-6 lg:h-[calc(100dvh-8rem)]">
        <div className="flex shrink-0 items-center justify-between gap-3">
          <p className="text-sm font-medium text-neutral-500">
            {loading ? copy.loading : "Community-Chat"}
          </p>
          <DashboardLanguageSwitcher locale={locale} onChange={setLocale} />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-6">
          <div className="shrink-0 lg:pt-1">
            <DashboardSideRail profile={profile} copy={copy} />
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <DashboardChatPanel
              loungeGroup={loungeGroup}
              userId={userId}
              profile={profile}
              verificationStatus={verificationStatus}
              communitiesCount={communities.length}
              subgroupsCount={subgroups.length}
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

        <DashboardMobileWidgets
          copy={copy}
          communities={communities}
          mentors={mentors}
          resourcePreview={resourcePreview}
          loungeGroup={loungeGroup}
        />

        <div className="flex shrink-0 gap-2 overflow-x-auto pb-1 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link href="/community" className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-neutral-300">
            Communities
          </Link>
          <Link href="/resources" className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-neutral-300">
            Ressourcen
          </Link>
          <Link href="/showcases" className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-neutral-300">
            Showcases
          </Link>
          <Link href="/mentoren" className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-neutral-300">
            Mentoren
          </Link>
        </div>
      </div>
    </>
  );
}
