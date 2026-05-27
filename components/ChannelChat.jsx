"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { canAccessChannel, communityChannels, getRankLabel } from "@/lib/founder-data";
import { RankBadge } from "@/components/RankBadge";

function mergeProfiles(posts, profiles) {
  return posts.map((post) => ({
    ...post,
    profile: profiles.find((profile) => profile.id === post.author_id),
  }));
}

export function ChannelChat() {
  const params = useParams();
  const router = useRouter();
  const slug = params.channel;
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const fallbackChannel = communityChannels.find((item) => item.slug === slug);

  const [channel, setChannel] = useState(fallbackChannel);
  const [profile, setProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const userRank = profile?.current_rank ?? "aspiring";
  const minRank = channel?.min_rank ?? "aspiring";
  const isPro = profile?.plan === "pro";
  const requiresPro = Boolean(channel?.requires_founder_pro);
  const canWrite = Boolean(profile) && canAccessChannel(userRank, minRank, isPro, requiresPro);

  const loadMessages = useCallback(async (channelId) => {
    const { data: posts, error } = await supabase
      .from("posts")
      .select("id,content,author_id,created_at")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      setMessage(error.message);
      return;
    }

    const authorIds = [...new Set((posts ?? []).map((post) => post.author_id))];
    if (authorIds.length === 0) {
      setMessages([]);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,display_name,username,current_rank,company_name")
      .in("id", authorIds);

    setMessages(mergeProfiles(posts ?? [], profiles ?? []));
  }, [supabase]);

  useEffect(() => {
    async function boot() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      const userId = sessionData.session.user.id;
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id,display_name,username,current_rank,company_name,plan")
        .eq("id", userId)
        .single();

      setProfile(profileData ?? { id: userId, display_name: sessionData.session.user.email, current_rank: "aspiring" });

      const { data: channelData } = await supabase
        .from("channels")
        .select("id,slug,name,category,description,min_rank,requires_founder_pro")
        .eq("slug", slug)
        .maybeSingle();

      const activeChannel = channelData ?? fallbackChannel;
      if (!activeChannel) {
        setMessage("Channel nicht gefunden.");
        setLoading(false);
        return;
      }

      setChannel(activeChannel);
      if (activeChannel.id) {
        await loadMessages(activeChannel.id);
      }
      setLoading(false);
    }

    boot();
  }, [fallbackChannel, loadMessages, router, slug, supabase]);

  async function sendMessage(event) {
    event.preventDefault();
    setMessage("");

    if (!channel?.id) {
      setMessage("Dieser Channel ist noch nicht in Supabase angelegt. Bitte Migration ausführen.");
      return;
    }

    if (!canWrite) {
      setMessage(
        requiresPro
          ? `Zum Schreiben brauchst du mindestens ${getRankLabel(minRank)} und Founder Pro.`
          : `Zum Schreiben brauchst du mindestens ${getRankLabel(minRank)}.`
      );
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) return;

    const { error } = await supabase.from("posts").insert({
      channel_id: channel.id,
      author_id: profile.id,
      content: trimmed,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setContent("");
    await loadMessages(channel.id);
  }

  if (loading) {
    return <p className="mt-8 rounded-2xl bg-white p-5 text-sm font-semibold text-slate-600">Channel wird geladen...</p>;
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-5">
          <div>
            <Link href="/community" className="text-sm font-bold text-founder-600">
              Zurück zur Community
            </Link>
            <h1 className="mt-3 font-serif text-4xl font-bold text-slate-950">{channel?.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{channel?.description}</p>
          </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <RankBadge rank={minRank} />
              {requiresPro && <span className="rounded-full bg-founder-600 px-3 py-1 text-xs font-bold text-white">Founder Pro</span>}
            </div>
        </div>

        <div className="mt-6 space-y-4">
          {messages.length === 0 && (
            <p className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-600">
              Noch keine Nachrichten. Starte die Diskussion.
            </p>
          )}
          {messages.map((item) => (
            <article key={item.id} className="rounded-2xl bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold text-slate-950">
                  {item.profile?.display_name || item.profile?.username || "Mitglied"}
                </p>
                <RankBadge rank={item.profile?.current_rank ?? "aspiring"} prefix="" />
                <span className="text-xs font-semibold text-slate-400">
                  {new Date(item.created_at).toLocaleString("de-DE")}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.content}</p>
            </article>
          ))}
        </div>

        <form onSubmit={sendMessage} className="mt-6 space-y-3">
          <textarea
            className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-founder-600 focus:ring-4 focus:ring-founder-100 disabled:bg-slate-100"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={
              canWrite
                ? "Nachricht schreiben..."
                : requiresPro
                  ? `Schreiben ab ${getRankLabel(minRank)} mit Founder Pro`
                  : `Schreiben ab ${getRankLabel(minRank)}`
            }
            disabled={!canWrite}
          />
          {message && <p className="rounded-2xl bg-founder-50 px-4 py-3 text-sm font-semibold text-founder-800">{message}</p>}
          <button
            type="submit"
            disabled={!canWrite}
            className="w-full rounded-2xl bg-founder-600 px-5 py-3 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Senden
          </button>
        </form>
      </section>

      <aside className="rounded-[2rem] border border-slate-200 bg-white p-5">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-founder-600">Dein Zugriff</p>
        <h2 className="mt-3 font-serif text-2xl font-bold text-slate-950">{getRankLabel(userRank)}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Dieser Channel ist ab {getRankLabel(minRank)} zugänglich
          {requiresPro ? " und zusätzlich für Founder Pro Mitglieder reserviert" : ""}. Schreiben ist nur für
          eingeloggte Mitglieder mit ausreichendem Zugriff aktiv.
        </p>
      </aside>
    </div>
  );
}
