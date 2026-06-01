"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { RankNobleBadge } from "@/components/RankNobleBadge";
import { GroupChatProfileModal } from "@/components/groups/GroupChatProfileModal";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getSimulatedChatMessages, getDueSimulatedMessage, msUntilNextSimulatedMessage } from "@/lib/group-chat-simulator";
import { getMessages, getProfilesByIds, postMessage } from "@/lib/groups";
import { Send, Users } from "lucide-react";

function attachProfiles(messages, profiles) {
  return messages.map((message) => ({
    ...message,
    profile: message.profile ?? profiles.find((profile) => profile.id === message.author_id),
  }));
}

function formatMessageTime(value) {
  return new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
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
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [liveSeedMessages, setLiveSeedMessages] = useState([]);

  const baseSeedMessages = useMemo(
    () => getSimulatedChatMessages(group, groupId ?? group?.slug ?? "group"),
    [group, groupId]
  );

  const displayMessages = useMemo(() => {
    const seedById = new Map();
    [...baseSeedMessages, ...liveSeedMessages].forEach((message) => {
      seedById.set(message.id, message);
    });
    const seeds = [...seedById.values()];

    return [...seeds, ...messages].sort(
      (left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
    );
  }, [baseSeedMessages, liveSeedMessages, messages]);

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
  }, [displayMessages, scrollToBottom]);

  useEffect(() => {
    if (!groupId) return;

    const knownIds = new Set(baseSeedMessages.map((message) => message.id));
    let timeoutId;
    let cancelled = false;

    function scheduleNextTick() {
      if (cancelled) return;

      const due = getDueSimulatedMessage(group, groupId, Date.now(), knownIds);
      if (due) {
        knownIds.add(due.id);
        setLiveSeedMessages((current) => {
          if (current.some((message) => message.id === due.id)) return current;
          return [...current, due];
        });
      }

      const delay = msUntilNextSimulatedMessage(groupId);
      timeoutId = window.setTimeout(scheduleNextTick, Math.min(delay, 20 * 60 * 1000));
    }

    scheduleNextTick();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [baseSeedMessages, group, groupId]);

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

  async function openProfile(message) {
    if (message.isSeed || !message.author_id || message.author_id === user?.id) return;

    if (message.profile?.id) {
      setSelectedProfile(message.profile);
      return;
    }

    const profiles = await getProfilesByIds(supabase, [message.author_id]);
    if (profiles[0]) setSelectedProfile(profiles[0]);
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
      </header>

      <div ref={scrollRef} className="h-[480px] space-y-3 overflow-y-auto px-4 py-5 sm:px-6">
        {displayMessages.map((message) => {
          const isOwn = !message.isSeed && message.author_id === user?.id;
          const displayName = message.profile?.display_name || message.profile?.username || "Founder Mitglied";
          const rank = message.profile?.current_rank ?? "aspiring";

          const avatar = (
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-founder-600 to-founder-800 font-serif text-lg font-bold text-white shadow-md ring-2 ring-white/80">
              {!message.isSeed && message.profile?.avatar_url ? (
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
          );

          return (
            <article key={message.id} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
              {message.isSeed ? (
                <div className="shrink-0 rounded-2xl" title={displayName}>
                  {avatar}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openProfile(message)}
                  className="relative shrink-0 rounded-2xl transition hover:ring-2 hover:ring-founder-300"
                  title={`Profil von ${displayName} ansehen`}
                >
                  {avatar}
                </button>
              )}

              <div className={`max-w-[min(100%,640px)] ${isOwn ? "items-end text-right" : ""}`}>
                <div className={`mb-1.5 flex flex-wrap items-center gap-2 ${isOwn ? "justify-end" : ""}`}>
                  {message.isSeed ? (
                    <span className="font-semibold tracking-tight text-slate-950">{displayName}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openProfile(message)}
                      className="font-semibold tracking-tight text-slate-950 transition hover:text-founder-600"
                    >
                      {displayName}
                    </button>
                  )}
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

    {selectedProfile && (
      <GroupChatProfileModal profile={selectedProfile} viewerId={user?.id} onClose={() => setSelectedProfile(null)} />
    )}
    </>
  );
}
