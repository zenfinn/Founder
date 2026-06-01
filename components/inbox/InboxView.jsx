"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { MessageRequestForm } from "@/components/members/MessageRequestForm";
import { formatDisplayName } from "@/lib/public-profile";
import { Check, MessageCircle, Send, X } from "lucide-react";

function formatTime(value) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function ProfileAvatar({ profile, size = 44 }) {
  const name = formatDisplayName(profile, "F");
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-founder-600 to-founder-800 font-serif font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {profile?.avatar_url ? (
        <Image src={profile.avatar_url} alt="" width={size} height={size} className="h-full w-full object-cover" unoptimized />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  );
}

function ChatThread({ conversationId, onBack }) {
  const scrollRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [partner, setPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    let active = true;

    async function loadThread() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/dm/conversations/${conversationId}`);
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Chat konnte nicht geladen werden.");
        if (!active) return;
        setPartner(payload.partner);
        setMessages(payload.messages ?? []);
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadThread();

    return () => {
      active = false;
    };
  }, [conversationId]);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages]);

  async function handleSend(event) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;

    setSending(true);
    setError("");

    try {
      const response = await fetch(`/api/dm/conversations/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Nachricht konnte nicht gesendet werden.");
      setMessages((current) => [...current, payload.message]);
      setDraft("");
    } catch (sendError) {
      setError(sendError.message);
    } finally {
      setSending(false);
    }
  }

  const partnerName = formatDisplayName(partner, "Mitglied");

  return (
    <div className="flex h-full min-h-[520px] flex-col rounded-[2rem] border border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
        {onBack && (
          <button type="button" onClick={onBack} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 sm:hidden">
            Zurück
          </button>
        )}
        <ProfileAvatar profile={partner} size={40} />
        <div>
          <p className="font-bold text-slate-950">{partnerName}</p>
          <p className="text-xs font-semibold text-slate-500">Aktiver Chat</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
        {loading && <p className="text-sm font-semibold text-slate-500">Chat wird geladen...</p>}
        {!loading &&
          messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                message.sender_id !== partner?.id ? "ml-auto bg-founder-600 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p className={`mt-1 text-[10px] font-semibold ${message.sender_id !== partner?.id ? "text-founder-100" : "text-slate-400"}`}>
                {formatTime(message.created_at)}
              </p>
            </div>
          ))}
      </div>

      {error && <p className="mx-4 mb-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 sm:mx-5">{error}</p>}

      <form onSubmit={handleSend} className="border-t border-slate-100 p-4 sm:p-5">
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={1}
            placeholder="Nachricht schreiben..."
            className="min-h-[44px] flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-founder-600"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

export function InboxView() {
  const searchParams = useSearchParams();
  const composeUserId = searchParams.get("to");
  const initialChatId = searchParams.get("chat");
  const openRequests = searchParams.get("requests") === "1";

  const [section, setSection] = useState(openRequests ? "requests" : "chats");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [conversations, setConversations] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [activeChatId, setActiveChatId] = useState(initialChatId);
  const [composeProfile, setComposeProfile] = useState(null);
  const [actionId, setActionId] = useState(null);

  const pendingCount = incomingRequests.length;

  const loadInbox = useMemo(
    () => async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/inbox", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Inbox konnte nicht geladen werden.");
        setConversations(payload.conversations ?? []);
        setIncomingRequests(payload.incomingRequests ?? []);
        setOutgoingRequests(payload.outgoingRequests ?? []);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  useEffect(() => {
    if (initialChatId) setActiveChatId(initialChatId);
  }, [initialChatId]);

  useEffect(() => {
    if (!composeUserId) {
      setComposeProfile(null);
      return;
    }

    let active = true;

    async function loadComposeProfile() {
      const response = await fetch(`/api/members/${composeUserId}`);
      const payload = await response.json().catch(() => ({}));
      if (!active) return;
      if (response.ok) {
        setComposeProfile(payload.profile ?? null);
        setSection("chats");
      }
    }

    loadComposeProfile();

    return () => {
      active = false;
    };
  }, [composeUserId]);

  async function handleRequestAction(requestId, action) {
    setActionId(requestId);
    setError("");

    try {
      const response = await fetch(`/api/message-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Anfrage konnte nicht bearbeitet werden.");

      await loadInbox();

      if (action === "accept" && payload.conversationId) {
        setSection("chats");
        setActiveChatId(payload.conversationId);
      }
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-[2rem] border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex gap-2 rounded-full bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setSection("chats")}
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-bold transition ${
              section === "chats" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"
            }`}
          >
            Chats
          </button>
          <button
            type="button"
            onClick={() => setSection("requests")}
            className={`relative flex-1 rounded-full px-4 py-2.5 text-sm font-bold transition ${
              section === "requests" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"
            }`}
          >
            Anfragen
            {pendingCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-founder-600 px-1.5 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {loading && <p className="text-sm font-semibold text-slate-500">Chats werden geladen...</p>}

          {section === "chats" && !loading && conversations.length === 0 && !composeUserId && (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">Noch keine aktiven Chats.</p>
          )}

          {section === "chats" &&
            conversations.map((conversation) => {
              const partnerName = formatDisplayName(conversation.partner, "Mitglied");
              const isActive = activeChatId === conversation.id;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setActiveChatId(conversation.id)}
                  className={`flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition ${
                    isActive ? "bg-founder-50 ring-1 ring-founder-200" : "hover:bg-slate-50"
                  }`}
                >
                  <ProfileAvatar profile={conversation.partner} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-950">{partnerName}</p>
                    <p className="truncate text-xs font-medium text-slate-500">
                      {conversation.lastMessage?.content ?? "Neuer Chat"}
                    </p>
                  </div>
                </button>
              );
            })}

          {section === "chats" && !loading && outgoingRequests.length > 0 && (
            <div className="pt-2">
              <p className="px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Ausstehend</p>
              {outgoingRequests.map((request) => (
                <div key={request.id} className="mt-2 rounded-2xl bg-amber-50 px-3 py-3">
                  <p className="text-sm font-bold text-amber-900">{formatDisplayName(request.recipient, "Mitglied")}</p>
                  <p className="mt-1 text-xs leading-5 text-amber-800">Anfrage gesendet – wartet auf Antwort</p>
                </div>
              ))}
            </div>
          )}

          {section === "requests" && !loading && incomingRequests.length === 0 && (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">Keine offenen Anfragen.</p>
          )}

          {section === "requests" &&
            incomingRequests.map((request) => (
              <article key={request.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <ProfileAvatar profile={request.sender} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-950">{formatDisplayName(request.sender, "Mitglied")}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{request.message}</p>
                    <p className="mt-2 text-[11px] font-semibold text-slate-400">{formatTime(request.created_at)}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    disabled={actionId === request.id}
                    onClick={() => handleRequestAction(request.id, "accept")}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" />
                    Anfrage annehmen
                  </button>
                  <button
                    type="button"
                    disabled={actionId === request.id}
                    onClick={() => handleRequestAction(request.id, "reject")}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                  >
                    <X className="h-4 w-4" />
                    Ablehnen
                  </button>
                </div>
              </article>
            ))}
        </div>
      </aside>

      <div className="min-h-[520px]">
        {error && <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

        {composeUserId && composeProfile ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <ProfileAvatar profile={composeProfile} size={48} />
              <div>
                <p className="font-bold text-slate-950">{formatDisplayName(composeProfile, "Mitglied")}</p>
                <p className="text-sm text-slate-500">Neue Nachrichtenanfrage</p>
              </div>
            </div>
            <MessageRequestForm
              recipientId={composeProfile.id}
              recipientName={formatDisplayName(composeProfile, "Mitglied")}
              onSent={() => loadInbox()}
            />
          </div>
        ) : activeChatId ? (
          <ChatThread conversationId={activeChatId} onBack={() => setActiveChatId(null)} />
        ) : (
          <div className="flex h-full min-h-[520px] items-center justify-center rounded-[2rem] border border-dashed border-slate-200 bg-white p-8 text-center">
            <div>
              <MessageCircle className="mx-auto h-10 w-10 text-founder-600" />
              <h2 className="mt-4 font-serif text-2xl font-bold text-slate-950">Wähle einen Chat oder eine Anfrage</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Neue Kontakte erscheinen unter Anfragen. Nach dem Annehmen kannst du hier frei antworten.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
