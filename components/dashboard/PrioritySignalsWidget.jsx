"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { fetchPrioritySignals, formatPrioritySignalTime } from "@/lib/priority-signals";
import { Radio } from "lucide-react";

function TileLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
      <Icon className="h-3.5 w-3.5 text-[#1a3aad]" strokeWidth={2} />
      {children}
    </div>
  );
}

export function PrioritySignalsWidget({ userId, communityGroupIds, embedded = false, copy }) {
  const labels = copy ?? {
    prioritySignals: "Priority Signale",
    prioritySignalsHint: "Aktuelle Community-Diskussionen und DMs.",
    prioritySignalsEmpty: "Noch keine Signale — starte einen Chat oder tritt einer Community bei.",
    openAllChats: "Alle Chats öffnen",
    loading: "Lädt…",
  };
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const groupIdsKey = useMemo(() => communityGroupIds.join(","), [communityGroupIds]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    const supabase = createBrowserSupabaseClient();
    const groupIds = groupIdsKey ? groupIdsKey.split(",") : [];

    async function loadSignals() {
      setLoading(true);
      try {
        const rows = await fetchPrioritySignals(supabase, userId, groupIds);
        if (active) setSignals(rows);
      } catch {
        if (active) setSignals([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSignals();
    return () => {
      active = false;
    };
  }, [userId, groupIdsKey]);

  const content = (
    <>
      <TileLabel icon={Radio}>{labels.prioritySignals}</TileLabel>
      <p className="mt-2 text-xs text-neutral-500">{labels.prioritySignalsHint}</p>

      <div className="mt-3 min-h-0 flex-1">
        {loading ? (
          <ul className="space-y-2" aria-hidden>
            {[0, 1, 2, 3].map((item) => (
              <li key={item} className="flex items-center justify-between gap-3 py-2">
                <span className="h-3.5 flex-1 animate-pulse rounded bg-[#1a3aad]/15" />
                <span className="h-3 w-12 animate-pulse rounded bg-[#1a3aad]/10" />
              </li>
            ))}
          </ul>
        ) : signals.length === 0 ? (
          <p className="py-2 text-xs text-neutral-500">{labels.prioritySignalsEmpty}</p>
        ) : (
          <ul className="divide-y divide-[#1a3aad]/15">
            {signals.map((signal) => (
              <li key={signal.id}>
                <Link
                  href={signal.href}
                  className="group flex items-center justify-between gap-3 py-2.5 transition hover:text-[#5b8cff]"
                >
                  <span className="truncate text-sm font-medium text-neutral-200 group-hover:text-white">{signal.title}</span>
                  <time dateTime={signal.createdAt} className="shrink-0 text-[11px] tabular-nums text-neutral-500">
                    {formatPrioritySignalTime(signal.createdAt)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link href="/inbox" className="mt-3 inline-flex text-xs font-semibold text-[#1a3aad] transition hover:text-[#2f61df]">
        {labels.openAllChats}
      </Link>
    </>
  );

  if (embedded) return content;

  return <div className="flex h-full flex-col">{content}</div>;
}
