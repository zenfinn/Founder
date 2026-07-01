"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const STEP_LAYOUT = {
  1: { order: "order-2 md:col-start-2", height: "h-44 md:h-52", delay: 0.35 },
  2: { order: "order-1 md:col-start-1", height: "h-36 md:h-40", delay: 0.15 },
  3: { order: "order-3 md:col-start-3", height: "h-28 md:h-32", delay: 0.55 },
};

function StairStep({ group, rank, onJoin, joining, joined, preview = false }) {
  const layout = STEP_LAYOUT[rank] ?? STEP_LAYOUT[3];
  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };

  return (
    <motion.article
      initial={{ opacity: 0, y: 32, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: layout.delay, type: "spring", stiffness: 120, damping: 16 }}
      className={`flex flex-col ${layout.order} ${layout.height} rounded-t-2xl border border-t-4 bg-gradient-to-b p-4 ${
        rank === 1
          ? "border-t-amber-400/80 from-amber-500/20 to-[#0a0a0a] shadow-[0_0_48px_rgba(251,191,36,0.15)]"
          : "border-t-[#5b8cff]/60 from-[#1a3aad]/15 to-[#0a0a0a]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xl">{medals[rank]}</span>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-400">
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
          <h3 className="mt-2 font-serif text-base font-bold text-white md:text-lg">{group.name}</h3>
          <p className="text-[11px] text-[#5b8cff]">{group.category}</p>
          <p className="mt-1 flex-1 text-xs leading-5 text-neutral-400 line-clamp-3">
            {group.matchReason ?? group.coachTip}
          </p>
          <button
            type="button"
            disabled={joining || joined}
            onClick={() => onJoin?.(group)}
            className="mt-3 w-full rounded-xl bg-[#1a3aad] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#2448c7] disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
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
    <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
      <Loader2 className="h-10 w-10 animate-spin text-[#5b8cff]" />
      <p className="mt-6 font-serif text-xl text-white">Founder matcht deine Nischen…</p>
      <p className="mt-2 text-sm text-neutral-500">Dein Treppchen wird aufgebaut.</p>

      <div className="mt-10 grid w-full max-w-3xl grid-cols-1 items-end gap-3 md:grid-cols-3 md:gap-4">
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
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5b8cff]">Phase 2</p>
        <h2 className="mt-2 font-serif text-2xl font-bold text-white">Deine Top-3 Nischen</h2>
        <p className="mt-1 text-sm text-neutral-400">Steig ein — ein Klick und du bist in der Gruppe.</p>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-3 md:gap-4">
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
    </div>
  );
}
