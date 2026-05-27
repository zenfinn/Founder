"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { RankNobleBadge } from "@/components/RankNobleBadge";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getMessages, getProfilesByIds, postMessage } from "@/lib/groups";
import { ExternalLink, Send, Users, Video, X } from "lucide-react";

function attachProfiles(messages, profiles) {
  return messages.map((message) => ({
    ...message,
    profile: profiles.find((profile) => profile.id === message.author_id),
  }));
}

function formatMessageTime(value) {
  return new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function buildVideoRoomUrl(group) {
  const slug = (group?.category ?? group?.name ?? "group")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const id = String(group?.id ?? "room").replace(/-/g, "").slice(0, 12);
  return `https://meet.jit.si/Founder-${slug}-${id}`;
}

export function GroupChat({ groupId, group }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const scrollRef = useRef(null);
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

  const videoRoomUrl = useMemo(() => buildVideoRoomUrl({ ...group, id: groupId }), [group, groupId]);

  const scrollToBottom = useCallback(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, []);

  const loadMessages = useCallback(async () => {
    try {
      const rows = await getMessages(supabase, groupId);
      const profiles = await getProfilesByIds(supabase, rows.map((message) => message.author_id));
      setMessages(attachProfiles(rows, profiles));
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }, [groupId, supabase]);

  useEffect(() => {
    async function boot() {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      await loadMessages();
    }

    boot();
  }, [loadMessages, supabase]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const realtimeChannel = supabase
      .channel(`founder-group-posts-${groupId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts", filter: `group_id=eq.${groupId}` },
        async (payload) => {
          if (payload.new.type && payload.new.type !== "message") return;

          const profiles = await getProfilesByIds(supabase, [payload.new.author_id]);
          const [messageWithProfile] = attachProfiles([payload.new], profiles);
          setMessages((current) => {
            if (current.some((message) => message.id === messageWithProfile.id)) return current;
            return [...current, messageWithProfile];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [groupId, supabase]);

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice("");

    const trimmed = messageText.trim();
    if (!trimmed || !user || sending) return;

    setSending(true);
    try {
      const created = await postMessage(supabase, { groupId, userId: user.id, messageText: trimmed });
      setMessageText("");

      if (created?.author_id === user.id) {
        const profiles = await getProfilesByIds(supabase, [user.id]);
        const [messageWithProfile] = attachProfiles([created], profiles);
        setMessages((current) => {
          if (current.some((message) => message.id === messageWithProfile.id)) return current;
          return [...current, messageWithProfile];
        });
      }
    } catch (error) {
      setNotice(error.message);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <section className="flex h-[640px] items-center justify-center rounded-[2rem] border border-white/60 bg-white/70 p-8 shadow-soft backdrop-blur-xl">
        <p className="text-sm font-semibold tracking-wide text-slate-500">Chat wird geladen...</p>
      </section>
    );
  }

  return (
    <>
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-b from-white/90 via-white/75 to-slate-50/80 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)] backdrop-blur-2xl">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200/60 bg-white/50 px-5 py-4 backdrop-blur-xl sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-founder-600">Live Community</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h2 className="truncate font-serif text-2xl font-bold tracking-tight text-slate-950">
                {group?.name ?? "Gruppen-Chat"}
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 backdrop-blur">
                <Users className="h-3.5 w-3.5 text-founder-600" />
                {(group?.member_count ?? 0).toLocaleString("de-DE")}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setVideoOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-founder-200 hover:bg-founder-50 hover:text-founder-700"
            title="Gruppen-Videocall starten oder beitreten"
          >
            <Video className="h-4 w-4" />
            <span className="hidden sm:inline">Videocall</span>
          </button>
        </header>

        <div ref={scrollRef} className="h-[480px] space-y-3 overflow-y-auto px-4 py-5 sm:px-6">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <p className="max-w-sm rounded-[1.25rem] border border-dashed border-slate-200/80 bg-white/60 px-6 py-5 text-center text-sm leading-6 text-slate-500 backdrop-blur">
                Noch keine Nachrichten. Starte den ersten Austausch in dieser Gruppe.
              </p>
            </div>
          )}

          {messages.map((message) => {
            const isOwn = message.author_id === user?.id;
            const displayName = message.profile?.display_name || message.profile?.username || "Founder Mitglied";
            const rank = message.profile?.current_rank ?? "aspiring";

            return (
              <article
                key={message.id}
                className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
              >
                <Link
                  href={`/members/${message.author_id}`}
                  className="relative shrink-0 rounded-2xl transition hover:ring-2 hover:ring-founder-300"
                  title={`Profil von ${displayName} ansehen`}
                >
                  <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-founder-600 to-founder-800 font-serif text-lg font-bold text-white shadow-md ring-2 ring-white/80">
                    {message.profile?.avatar_url ? (
                      <Image
                        src={message.profile.avatar_url}
                        alt=""
                        width={44}
                        height={44}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                </Link>

                <div className={`max-w-[min(100%,640px)] ${isOwn ? "items-end text-right" : ""}`}>
                  <div className={`mb-1.5 flex flex-wrap items-center gap-2 ${isOwn ? "justify-end" : ""}`}>
                    <Link href={`/members/${message.author_id}`} className="font-semibold tracking-tight text-slate-950 hover:text-founder-600">
                      {displayName}
                    </Link>
                    <RankNobleBadge rank={rank} size="sm" />
                    <span className="text-[11px] font-medium text-slate-400">{formatMessageTime(message.created_at)}</span>
                  </div>
                  <div
                    className={`rounded-[1.25rem] border px-4 py-3 text-sm leading-6 shadow-sm backdrop-blur-md ${
                      isOwn
                        ? "border-founder-200/80 bg-founder-600/95 text-white"
                        : "border-white/70 bg-white/75 text-slate-700"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {notice && (
          <p className="mx-5 mb-3 rounded-2xl border border-red-100 bg-red-50/90 px-4 py-3 text-sm font-semibold text-red-700 backdrop-blur sm:mx-6">
            {notice}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="border-t border-slate-200/60 bg-white/55 px-4 py-4 backdrop-blur-xl sm:px-6"
        >
          <div className="flex items-end gap-3 rounded-[1.25rem] border border-white/80 bg-white/80 p-2 shadow-inner backdrop-blur">
            <textarea
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmit(event);
                }
              }}
              rows={1}
              className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
              placeholder="Nachricht schreiben..."
            />
            <button
              type="submit"
              disabled={sending || !messageText.trim()}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white transition hover:bg-founder-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </section>

      {videoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/20 bg-white/90 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-founder-600">Gruppen-Videocall</p>
                <h3 className="mt-1 font-serif text-2xl font-bold text-slate-950">{group?.name ?? "Founder Gruppe"}</h3>
              </div>
              <button
                type="button"
                onClick={() => setVideoOpen(false)}
                className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <p className="text-sm leading-6 text-slate-600">
                Starte oder tritt dem Live-Raum dieser Gruppe bei. Der Raum ist nur für Mitglieder mit Link zugänglich.
              </p>
              <div className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-slate-950">
                <iframe
                  title="Gruppen-Videocall"
                  src={videoRoomUrl}
                  allow="camera; microphone; fullscreen; display-capture"
                  className="h-[360px] w-full"
                />
              </div>
              <a
                href={videoRoomUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-founder-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-founder-700"
              >
                <ExternalLink className="h-4 w-4" />
                In neuem Tab öffnen
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
