"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { RankNobleBadge } from "@/components/RankNobleBadge";
import { GroupChatProfileModal } from "@/components/groups/GroupChatProfileModal";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getSimulatedChatMessages, getDueSimulatedMessage, msUntilNextSimulatedMessage } from "@/lib/group-chat-simulator";
import { getMessages, getProfilesByIds, postMessage } from "@/lib/groups";
import { Send } from "lucide-react";

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
    return <p className="py-8 text-sm font-semibold tracking-wide text-neutral-500">Chat wird geladen…</p>;
  }

  return (
    <>
      <section className="flex flex-col">
        <div ref={scrollRef} className="h-[min(62vh,560px)] space-y-4 overflow-y-auto py-1">
          {displayMessages.map((message) => {
            const isOwn = !message.isSeed && message.author_id === user?.id;
            const displayName = message.profile?.display_name || message.profile?.username || "Founder Mitglied";
            const rank = message.profile?.current_rank ?? "aspiring";

            const avatar = (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden border border-[#1a3aad]/40 bg-[#0a0a0a] font-serif text-sm font-bold text-white">
                {!message.isSeed && message.profile?.avatar_url ? (
                  <Image
                    src={message.profile.avatar_url}
                    alt=""
                    width={40}
                    height={40}
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
                  <div title={displayName}>{avatar}</div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openProfile(message)}
                    className="transition hover:border-[#1a3aad]"
                    title={`Profil von ${displayName} ansehen`}
                  >
                    {avatar}
                  </button>
                )}

                <div className={`max-w-[min(100%,640px)] ${isOwn ? "items-end text-right" : ""}`}>
                  <div className={`mb-1.5 flex flex-wrap items-center gap-2 ${isOwn ? "justify-end" : ""}`}>
                    {message.isSeed ? (
                      <span className="font-semibold text-white">{displayName}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openProfile(message)}
                        className="font-semibold text-white transition hover:text-[#5b8cff]"
                      >
                        {displayName}
                      </button>
                    )}
                    <RankNobleBadge rank={rank} size="sm" />
                    <span className="text-[11px] font-medium tabular-nums text-neutral-500">
                      {formatMessageTime(message.created_at)}
                    </span>
                  </div>
                  <div className="border border-[#1a3aad] bg-[#0a0a0a] px-4 py-3 text-sm leading-6">
                    <p className="whitespace-pre-wrap text-neutral-300">{message.content}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {notice && (
          <p className="mt-3 border border-red-500/30 px-4 py-3 text-sm font-semibold text-red-300">{notice}</p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 border-t border-[#1a3aad]/25 pt-4">
          <div className="flex items-end gap-2 border border-[#1a3aad]/35 bg-[#0a0a0a] p-2">
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
              className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2.5 text-sm font-medium text-neutral-200 outline-none placeholder:text-neutral-600"
              placeholder="Nachricht schreiben…"
            />
            <button
              type="submit"
              disabled={sending || !messageText.trim()}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-[#1a3aad] bg-[#1a3aad] text-white transition hover:bg-[#2f61df] disabled:cursor-not-allowed disabled:opacity-40"
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
