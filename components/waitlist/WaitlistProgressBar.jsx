"use client";

import { getWaitlistProgress } from "@/lib/waitlist";

export function WaitlistProgressBar({ total = 23, max = 100 }) {
  const progress = getWaitlistProgress(total);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#1a3aad]/35 bg-[#0a0a0a]/90 px-4 py-4 backdrop-blur-xl">
      <div className="mx-auto max-w-2xl">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold">
          <span className="uppercase tracking-[0.18em] text-neutral-500">Waitlist</span>
          <span className="tabular-nums text-[#5b8cff]">
            {total.toLocaleString("de-DE")} / {max.toLocaleString("de-DE")} Plätze
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full border border-[#1a3aad]/25 bg-[#0f0f0f]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#1a3aad] to-[#5b8cff] transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={total}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-label={`Waitlist ${total} von ${max}`}
          />
        </div>
        <p className="mt-2 text-center text-[11px] text-neutral-500">
          {max - total > 0
            ? `Noch ${(max - total).toLocaleString("de-DE")} Plätze bis zum Launch`
            : "Waitlist voll — wir starten bald."}
        </p>
      </div>
    </div>
  );
}
