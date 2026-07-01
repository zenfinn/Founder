"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const STEP_LAYOUT = {
  1: {
    order: "order-1",
    desktopOrder: "md:order-2 md:col-start-2",
    minHeight: "md:min-h-[15.5rem]",
    stairOffset: "md:mb-0",
    delay: 0.1,
  },
  2: {
    order: "order-2",
    desktopOrder: "md:order-1 md:col-start-1",
    minHeight: "md:min-h-[13.5rem]",
    stairOffset: "md:mb-6",
    delay: 0.2,
  },
  3: {
    order: "order-3",
    desktopOrder: "md:order-3 md:col-start-3",
    minHeight: "md:min-h-[12rem]",
    stairOffset: "md:mb-10",
    delay: 0.3,
  },
};

function StairStep({ group, rank, onJoin, joining, joined, preview = false }) {
  const layout = STEP_LAYOUT[rank] ?? STEP_LAYOUT[3];
  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: layout.delay, type: "spring", stiffness: 120, damping: 16 }}
      className={`flex min-h-[11.5rem] flex-col ${layout.order} ${layout.desktopOrder} ${layout.minHeight} ${layout.stairOffset} rounded-2xl border border-white/10 border-t-4 bg-gradient-to-b p-4 ${
        rank === 1
          ? "border-t-amber-400/80 from-amber-500/20 to-[#0a0a0a] shadow-[0_0_48px_rgba(251,191,36,0.12)]"
          : "border-t-[#5b8cff]/60 from-[#1a3aad]/15 to-[#0a0a0a]"
      }`}
    >
      <div className="flex shrink-0 items-center justify-between gap-2">
        <span className="text-2xl">{medals[rank]}</span>
        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-neutral-400">
          #{rank}
        </span>
      </div>

      {preview ? (
        <div className="mt-4 flex flex-1 flex-col justify-end gap-2">
          <div className="h-3 w-3/4 animate-pulse rounded bg-white/10" />
          <div className="h-2 w-1/2 animate-pulse rounded bg-white/5" />
        </div>
      ) : (
        <>
          <h3 className="mt-2 shrink-0 font-serif text-lg font-bold leading-tight text-white">{group.name}</h3>
          <p className="shrink-0 text-xs text-[#5b8cff]">{group.category}</p>
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-5 text-neutral-400">
            {group.matchReason ?? group.coachTip}
          </p>
          <button
            type="button"
            disabled={joining || joined}
            onClick={() => onJoin?.(group)}
            className="mt-3 shrink-0 min-h-[44px] w-full rounded-xl bg-[#1a3aad] px-4 py-3 text-sm font-semibold text-white transition active:scale-[0.98] hover:bg-[#2448c7] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {joined ? "Beigetreten ✓" : joining ? "Beitritt…" : "Beitreten"}
          </button>
        </>
      )}
    </motion.article>
  );
}

export function FounderStaircaseLoading() {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center px-2 text-center sm:min-h-[320px]">
      <Loader2 className="h-9 w-9 animate-spin text-[#5b8cff] sm:h-10 sm:w-10" />
      <p className="mt-5 font-serif text-lg text-white sm:mt-6 sm:text-xl">Founder matcht deine Nischen…</p>
      <p className="mt-2 text-sm text-neutral-500">Dein Treppchen wird aufgebaut.</p>

      <div className="mt-8 grid w-full max-w-3xl grid-cols-1 items-end gap-3 md:mt-10 md:grid-cols-3 md:gap-4">
        <StairStep rank={2} preview />
        <StairStep rank={1} preview />
        <StairStep rank={3} preview />
      </div>
    </div>
  );
}

export function FounderNicheStaircase({ groups, onJoin, joiningSlug, joinedSlugs }) {
  const byRank = [1, 2, 3].map((rank) => groups.find((g) => g.rank === rank)).filter(Boolean);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5b8cff] sm:text-xs">Phase 2</p>
        <h2 className="mt-2 font-serif text-xl font-bold text-white sm:text-2xl">Deine Top-3 Nischen</h2>
        <p className="mt-1 text-sm text-neutral-400">Ein Tipp — und du bist in der Gruppe.</p>
      </div>

      <div className="grid grid-cols-1 items-end gap-3 pb-1 md:grid-cols-3 md:gap-4">
        {byRank.map((group) => (
          <StairStep
            key={group.id ?? group.slug}
            group={group}
            rank={group.rank}
            onJoin={onJoin}
            joining={joiningSlug === group.slug}
            joined={Boolean(joinedSlugs?.[group.slug])}
          />
        ))}
      </div>
    </div>
  );
}
