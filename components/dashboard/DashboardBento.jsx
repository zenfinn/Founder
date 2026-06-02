"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { FounderProIntentHandler } from "@/components/FounderProIntentHandler";
import { FeedAvatar } from "@/components/FeedAvatar";
import { RankBadge } from "@/components/RankBadge";
import { DashboardOnboardingSteps } from "@/components/DashboardOnboardingSteps";
import { BentoTile } from "@/components/dashboard/BentoTile";
import { DashboardBottomNav } from "@/components/dashboard/DashboardBottomNav";
import { getProfileWelcomeName, isFounderPro } from "@/lib/membership";
import { writeDashboardVariant } from "@/lib/dashboard-variant";
import {
  ArrowUpRight,
  FolderOpen,
  LayoutGrid,
  MessageSquare,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";

function TileLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
      <Icon className="h-3.5 w-3.5 text-[#1a3aad]" strokeWidth={2} />
      {children}
    </div>
  );
}

export function DashboardBento({
  profile,
  userId,
  verificationStatus,
  posts,
  communities,
  mentors,
  subgroups,
  loading,
  onSwitchClassic,
}) {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 2;
    const y = (event.clientY / window.innerHeight - 0.5) * 2;
    setParallax({ x, y });
  }, []);

  const welcomeName = getProfileWelcomeName(profile);
  const currentRank = profile?.current_rank ?? "aspiring";
  const proMember = isFounderPro(profile);
  const primaryCommunity = communities[0];
  const nextMentor = mentors[0];

  return (
    <main
      className="min-h-screen bg-[#050505] pb-28 text-neutral-100"
      onMouseMove={handleMouseMove}
    >
      <FounderProIntentHandler />

      <div className="mx-auto max-w-7xl px-4 pb-6 pt-8 md:px-6 md:pt-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-neutral-500">Founder</p>
          <button
            type="button"
            onClick={() => {
              writeDashboardVariant("classic");
              onSwitchClassic();
            }}
            className="text-xs font-medium text-neutral-500 transition hover:text-[#1a3aad]"
          >
            Klassisches Layout
          </button>
        </div>

        <div className="grid auto-rows-min grid-cols-1 gap-3 md:grid-cols-12 md:gap-4">
          <BentoTile className="md:col-span-8" delay={0} parallax={parallax} depth={3}>
            <TileLabel icon={Sparkles}>Übersicht</TileLabel>
            <h1 className="mt-4 font-serif text-3xl font-bold tracking-tight text-white md:text-4xl">
              Willkommen zurück, {welcomeName}.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-400">
              Dein Fintech-Dashboard für Community, Mentoring und Wachstum — kompakt und fokussiert.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <RankBadge rank={currentRank} />
              <span className="rounded-full border border-[#1a3aad]/40 px-3 py-1 text-xs font-semibold text-neutral-300">
                {proMember ? "Founder Pro" : "Basic"}
              </span>
              <span className="rounded-full border border-[#1a3aad]/25 px-3 py-1 text-xs font-semibold text-neutral-400">
                Verifikation: {verificationStatus}
              </span>
            </div>
          </BentoTile>

          <BentoTile className="md:col-span-4 md:row-span-2" delay={0.06} parallax={parallax} depth={6}>
            <TileLabel icon={MessageSquare}>Live-Chat</TileLabel>
            <p className="mt-3 text-sm text-neutral-400">Aktuelle Signale aus deinen Communities.</p>
            <div className="mt-4 flex-1 space-y-3">
              {loading ? (
                <p className="text-sm text-neutral-500">Lädt…</p>
              ) : (
                posts.slice(0, 3).map((post) => (
                  <div key={post.id} className="rounded-xl border border-[#1a3aad]/20 p-3">
                    <div className="flex items-start gap-3">
                      <FeedAvatar name={post.author} avatarUrl={post.avatarUrl} size={36} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{post.author}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-400">{post.text}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link
              href={primaryCommunity ? `/community/${primaryCommunity.id}` : "/community"}
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#1a3aad] transition hover:text-[#2f61df]"
            >
              Chat öffnen
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </BentoTile>

          <BentoTile className="md:col-span-4" delay={0.12} parallax={parallax} depth={5}>
            <TileLabel icon={FolderOpen}>Ressourcen</TileLabel>
            <p className="mt-3 flex-1 text-sm leading-6 text-neutral-400">
              Playbooks, Templates und geteiltes Wissen aus der Founder Community.
            </p>
            <Link
              href="/resources"
              className="mt-4 inline-flex w-fit items-center justify-center rounded-xl border border-[#1a3aad] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a3aad]"
            >
              Ressourcen öffnen
            </Link>
          </BentoTile>

          <BentoTile className="md:col-span-4" delay={0.18} parallax={parallax} depth={4}>
            <TileLabel icon={UserRound}>Mentoring-Status</TileLabel>
            {nextMentor ? (
              <>
                <p className="mt-3 text-lg font-semibold text-white">{nextMentor.mentor_name ?? "Mentor Session"}</p>
                <p className="mt-1 text-sm capitalize text-neutral-400">{nextMentor.status ?? "gebucht"}</p>
              </>
            ) : (
              <p className="mt-3 flex-1 text-sm leading-6 text-neutral-400">
                Noch keine Session gebucht. Finde verifizierte Mentoren für dein nächstes Level.
              </p>
            )}
            <Link
              href={nextMentor?.mentor_key ? `/mentoren/${nextMentor.mentor_key}` : "/mentoren"}
              className="mt-4 inline-flex w-fit items-center justify-center rounded-xl border border-[#1a3aad] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a3aad]"
            >
              {nextMentor ? "Session ansehen" : "Mentor finden"}
            </Link>
          </BentoTile>

          <BentoTile className="md:col-span-8" delay={0.24} parallax={parallax} depth={3}>
            <TileLabel icon={LayoutGrid}>Showcase</TileLabel>
            <p className="mt-3 flex-1 text-sm leading-6 text-neutral-400">
              Projekte, Launches und Wins von verifizierten Unternehmern — teile dein Business oder entdecke neue Ideen.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/showcases"
                className="inline-flex items-center justify-center rounded-xl bg-[#1a3aad] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2f61df]"
              >
                Showcases entdecken
              </Link>
              <Link
                href="/showcases"
                className="inline-flex items-center justify-center rounded-xl border border-[#1a3aad]/50 px-4 py-2 text-sm font-semibold text-neutral-200 transition hover:border-[#1a3aad]"
              >
                Projekt teilen
              </Link>
            </div>
          </BentoTile>

          <BentoTile className="md:col-span-6" delay={0.3} parallax={parallax} depth={4}>
            <TileLabel icon={Users}>Communities</TileLabel>
            <div className="mt-3 flex-1 space-y-2">
              {communities.length === 0 ? (
                <p className="text-sm text-neutral-500">Noch keiner Community beigetreten.</p>
              ) : (
                communities.slice(0, 4).map((group) => (
                  <Link
                    key={group.id}
                    href={`/community/${group.id}`}
                    className="flex items-center justify-between rounded-xl border border-[#1a3aad]/15 px-3 py-2 transition hover:border-[#1a3aad]/45"
                  >
                    <span className="truncate text-sm font-medium text-white">{group.name}</span>
                    <span className="ml-2 shrink-0 text-xs text-neutral-500">{group.category}</span>
                  </Link>
                ))
              )}
            </div>
            <Link href="/community" className="mt-3 text-sm font-semibold text-[#1a3aad] hover:text-[#2f61df]">
              + Community entdecken
            </Link>
          </BentoTile>

          <BentoTile className="md:col-span-6" delay={0.36} parallax={parallax} depth={5}>
            <div className="[&_*]:border-[#1a3aad]/25 [&_.rounded-\\[2rem\\]]:rounded-2xl [&_.bg-white]:bg-[#141414] [&_.text-slate-950]:text-white [&_.text-slate-600]:text-neutral-400 [&_.text-slate-500]:text-neutral-500 [&_.text-founder-600]:text-[#1a3aad] [&_.bg-founder-600]:bg-[#1a3aad] [&_.border-slate-200]:border-[#1a3aad]/25">
              <DashboardOnboardingSteps
                userId={userId}
                profile={profile}
                verificationStatus={verificationStatus}
                communitiesCount={communities.length}
                subgroupsCount={subgroups.length}
              />
            </div>
          </BentoTile>
        </div>
      </div>

      <DashboardBottomNav active="/dashboard" />
    </main>
  );
}
