"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Users, Video } from "lucide-react";
import { buildGroupVideoRoomUrl } from "@/lib/group-video-room";

export function GroupVideochat({ groupId, group }) {
  const [joining, setJoining] = useState(false);
  const videoRoomUrl = useMemo(() => buildGroupVideoRoomUrl({ ...group, id: groupId }), [group, groupId]);

  function handleJoinNewTab() {
    setJoining(true);
    window.open(videoRoomUrl, "_blank", "noopener,noreferrer");
    setTimeout(() => setJoining(false), 600);
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.65)]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-founder-300">Videochat</p>
          <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight text-white">{group?.name ?? "Gruppe"}</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300">
          <Users className="h-3.5 w-3.5" />
          {(group?.member_count ?? 0).toLocaleString("de-DE")} Mitglieder
        </span>
      </header>

      <div className="space-y-5 p-5 sm:p-6">
        <p className="text-sm leading-6 text-slate-400">
          Gemeinsamer Videochat-Raum für <span className="font-semibold text-slate-200">{group?.name ?? "diese Gruppe"}</span>.
          Kamera und Mikrofon werden erst beim Beitritt aktiviert — wer online ist, siehst du im Raum.
        </p>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
          <iframe
            title={`Videochat ${group?.name ?? "Gruppe"}`}
            src={videoRoomUrl}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="aspect-video w-full min-h-[320px] sm:min-h-[420px]"
          />
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleJoinNewTab}
            disabled={joining}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-founder-600 px-6 py-4 text-base font-bold text-white transition hover:bg-founder-500 disabled:opacity-70"
          >
            <Video className="h-5 w-5" />
            {joining ? "Raum wird geöffnet…" : "In neuem Tab beitreten"}
          </button>
          <a
            href={videoRoomUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/10"
          >
            <ExternalLink className="h-4 w-4" />
            Direktlink zum Raum
          </a>
        </div>
      </div>
    </section>
  );
}
