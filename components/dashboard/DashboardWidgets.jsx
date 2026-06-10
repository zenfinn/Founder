"use client";

import Link from "next/link";
import { isGlobalLounge } from "@/lib/dashboard-lounge";
import { ArrowUpRight, Calendar, Sparkles, Users } from "lucide-react";

function WidgetShell({ title, href, action, children }) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">{title}</h3>
        {href ? (
          <Link href={href} className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#5b8cff] hover:text-[#7aa3ff]">
            {action}
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function WidgetLink({ href, title, subtitle }) {
  return (
    <Link
      href={href}
      className="block rounded-xl px-2 py-2 transition hover:bg-white/[0.04]"
    >
      <p className="truncate text-sm font-medium text-neutral-200">{title}</p>
      {subtitle ? <p className="mt-0.5 truncate text-xs text-neutral-500">{subtitle}</p> : null}
    </Link>
  );
}

export function DashboardWidgets({
  copy,
  communities,
  mentors,
  resourcePreview,
  loungeGroup,
}) {
  const nextMentor = mentors[0];

  return (
    <aside className="flex w-full shrink-0 flex-col gap-3 lg:w-72">
      <WidgetShell title={copy.communities} href="/community" action={copy.discoverCommunity}>
        {communities.filter((group) => !isGlobalLounge(group)).length === 0 ? (
          <p className="px-2 text-xs leading-5 text-neutral-500">{copy.communitiesEmpty}</p>
        ) : (
          <div className="space-y-0.5">
            {communities
              .filter((group) => !isGlobalLounge(group))
              .slice(0, 4)
              .map((group) => (
              <WidgetLink
                key={group.id}
                href={`/community/${group.id}`}
                title={group.name}
                subtitle={`${group.member_count ?? 0} Mitglieder`}
              />
            ))}
          </div>
        )}
      </WidgetShell>

      <WidgetShell title="Tools" href="/resources" action="Alle">
        {resourcePreview.length === 0 ? (
          <p className="px-2 text-xs leading-5 text-neutral-500">Noch keine Tools sichtbar.</p>
        ) : (
          <div className="space-y-0.5">
            {resourcePreview.map((resource) => (
              <WidgetLink
                key={resource.id}
                href={loungeGroup?.id ? `/community/${loungeGroup.id}?tab=tools` : "/resources"}
                title={resource.title}
                subtitle={resource.group?.name ?? "Community"}
              />
            ))}
          </div>
        )}
      </WidgetShell>

      <WidgetShell title={copy.mentoring} href="/mentoren" action={nextMentor ? copy.viewSession : copy.findMentor}>
        {nextMentor ? (
          <WidgetLink
            href={nextMentor.mentor_key ? `/mentoren/${nextMentor.mentor_key}` : "/mentoren"}
            title={nextMentor.mentor_name ?? copy.mentoring}
            subtitle={copy.mentoringHint}
          />
        ) : (
          <p className="px-2 text-xs leading-5 text-neutral-500">{copy.mentoringEmpty}</p>
        )}
      </WidgetShell>

      <WidgetShell title="Events" href="/events" action="Ansehen">
        <Link
          href="/events"
          className="flex items-center gap-2 rounded-xl px-2 py-2 text-xs text-neutral-400 transition hover:bg-white/[0.04] hover:text-neutral-200"
        >
          <Calendar className="h-4 w-4 shrink-0 text-[#5b8cff]" />
          Aktuelle Founder Events entdecken
        </Link>
      </WidgetShell>
    </aside>
  );
}

export function DashboardMobileWidgets(props) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="min-w-[16rem] shrink-0">
        <DashboardWidgets {...props} />
      </div>
    </div>
  );
}
