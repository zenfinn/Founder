"use client";

import Link from "next/link";
import { FeedAvatar } from "@/components/FeedAvatar";
import { FounderProUpgradeButton } from "@/components/FounderProUpgradeButton";
import { RankBadge } from "@/components/RankBadge";
import { getProfileWelcomeName, isFounderPro } from "@/lib/membership";
import { ArrowUpRight, FolderOpen, LayoutGrid, Sparkles, Users } from "lucide-react";

function NavItem({ href, icon: Icon, label }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-neutral-400 transition hover:bg-white/[0.04] hover:text-white"
    >
      <Icon className="h-4 w-4 shrink-0 text-[#5b8cff]" strokeWidth={1.75} />
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export function DashboardSideRail({ profile, copy }) {
  const welcomeName = getProfileWelcomeName(profile);
  const proMember = isFounderPro(profile);

  return (
    <aside className="flex w-full shrink-0 flex-col gap-6 md:w-56 lg:w-60">
      <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-4">
        <FeedAvatar name={profile?.display_name ?? welcomeName} avatarUrl={profile?.avatar_url ?? ""} size={48} />
        <div className="min-w-0 flex-1 md:flex-none">
          <p className="truncate text-sm font-semibold text-white">{welcomeName}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <RankBadge rank={profile?.current_rank ?? "aspiring"} />
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium text-neutral-400">
              {proMember ? copy.founderPro : copy.basic}
            </span>
          </div>
          <Link
            href="/profile"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#5b8cff] hover:text-[#7aa3ff]"
          >
            Profil
            <ArrowUpRight className="h-3 w-3" />
          </Link>
          {!proMember && (
            <div className="mt-3 w-full">
              <FounderProUpgradeButton
                label={copy.proUpgradeCta}
                cancelPath="/dashboard"
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#1a3aad] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#2f61df] disabled:cursor-not-allowed disabled:opacity-70"
                errorClassName="mt-2 text-[11px] font-semibold text-red-400"
              />
            </div>
          )}
        </div>
      </div>

      <nav className="hidden flex-col gap-0.5 md:flex">
        <NavItem href="/community" icon={Users} label={copy.communities} />
        <NavItem href="/resources" icon={FolderOpen} label="Tools" />
        <NavItem href="/showcases" icon={LayoutGrid} label={copy.showcase} />
        <NavItem href="/mentoren" icon={Sparkles} label={copy.mentoring} />
      </nav>
    </aside>
  );
}
