"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { RankBadge } from "@/components/RankBadge";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  canAccessChannel,
  canAccessRank,
  communityChannels,
  getRankLabel,
  groupEvents,
  groupMentors,
  groupResources,
  groupTemplates,
} from "@/lib/founder-data";

const tabs = ["Chat", "Mentoren", "Ressourcen", "Vorlagen"];
const resourceCategories = ["Discord-Gruppen", "Telegram-Kanäle", "YouTube-Kanäle", "Kurse", "Tools"];

function formatPrice(priceCents = 0) {
  if (!priceCents) return "Kostenlos";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(priceCents / 100);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function mergeProfiles(posts, profiles) {
  return posts.map((post) => ({
    ...post,
    profile: profiles.find((profile) => profile.id === post.author_id),
  }));
}

function Stars({ rating }) {
  return <span className="text-sm font-bold text-amber-600">{"★".repeat(Math.round(rating))} {rating.toFixed(1)}</span>;
}

export function GroupDetailTabs() {
  const params = useParams();
  const slug = params.channel;
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const fallbackGroup = communityChannels.find((item) => item.slug === slug);

  const [activeTab, setActiveTab] = useState("Chat");
  const [group, setGroup] = useState(fallbackGroup);
  const [profile, setProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [resourceList, setResourceList] = useState(groupResources.filter((item) => item.group_slug === slug));
  const [templates, setTemplates] = useState(groupTemplates.filter((item) => item.group_slug === slug));
  const [content, setContent] = useState("");
  const [resourceForm, setResourceForm] = useState({
    title: "",
    description: "",
    category: "Tools",
    external_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const userRank = profile?.current_rank ?? "aspiring";
  const isVerified = userRank !== "aspiring";
  const minRank = group?.min_rank ?? "aspiring";
  const canWrite = Boolean(profile) && isVerified && canAccessChannel(userRank, minRank, profile?.plan === "pro", group?.requires_founder_pro);
  const groupMentorList = groupMentors.filter((mentor) => mentor.group_slugs.includes(slug));
  const groupEventList = groupEvents.filter((event) => event.group_slugs.includes(slug));
  const templatesAreFree = canAccessRank(userRank, "scaler");

  const fetchProfilesForPosts = useCallback(async (posts) => {
    const authorIds = [...new Set((posts ?? []).map((post) => post.author_id))];
    if (authorIds.length === 0) return [];

    const { data } = await supabase
      .from("profiles")
      .select("id,display_name,username,current_rank,avatar_url,company_name")
      .in("id", authorIds);

    return data ?? [];
  }, [supabase]);

  const loadMessages = useCallback(async (channelId) => {
    const { data: posts, error } = await supabase
      .from("posts")
      .select("id,content,author_id,created_at")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      setNotice(error.message);
      return;
    }

    const profiles = await fetchProfilesForPosts(posts ?? []);
    setMessages(mergeProfiles(posts ?? [], profiles));
  }, [fetchProfilesForPosts, supabase]);

  useEffect(() => {
    async function boot() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const userId = sessionData.session.user.id;
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id,display_name,username,current_rank,avatar_url,company_name,plan")
          .eq("id", userId)
          .single();

        setProfile(profileData ?? { id: userId, display_name: sessionData.session.user.email, current_rank: "aspiring" });
      }

      const { data: channelData } = await supabase
        .from("channels")
        .select("id,slug,name,category,description,min_rank,requires_founder_pro")
        .eq("slug", slug)
        .maybeSingle();

      const activeGroup = channelData ?? fallbackGroup;
      if (!activeGroup) {
        setNotice("Gruppe nicht gefunden.");
        setLoading(false);
        return;
      }

      setGroup(activeGroup);

      if (activeGroup.id) {
        await loadMessages(activeGroup.id);
      }

      const { data: resourceData } = await supabase
        .from("group_resources")
        .select("id,group_slug,title,description,category,external_url,status")
        .eq("group_slug", slug)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (resourceData?.length) setResourceList(resourceData);

      const { data: templateData } = await supabase
        .from("group_templates")
        .select("id,group_slug,title,file_type,price_cents,storage_path")
        .eq("group_slug", slug)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (templateData?.length) setTemplates(templateData);

      setLoading(false);
    }

    boot();
  }, [fallbackGroup, loadMessages, slug, supabase]);

  useEffect(() => {
    if (!group?.id) return undefined;

    const realtimeChannel = supabase
      .channel(`group-chat-${group.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts", filter: `channel_id=eq.${group.id}` },
        async (payload) => {
          const profiles = await fetchProfilesForPosts([payload.new]);
          const [messageWithProfile] = mergeProfiles([payload.new], profiles);
          setMessages((current) => {
            if (current.some((item) => item.id === messageWithProfile.id)) return current;
            return [...current, messageWithProfile];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [fetchProfilesForPosts, group?.id, supabase]);

  async function sendMessage(event) {
    event.preventDefault();
    setNotice("");

    if (!group?.id) {
      setNotice("Diese Gruppe ist noch nicht in Supabase angelegt. Bitte Migration ausführen.");
      return;
    }

    if (!canWrite) {
      setNotice("Nur verifizierte Mitglieder mit passendem Rang können schreiben.");
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) return;

    const { error } = await supabase.from("posts").insert({
      channel_id: group.id,
      author_id: profile.id,
      content: trimmed,
    });

    if (error) {
      setNotice(error.message);
      return;
    }

    setContent("");
  }

  async function suggestResource(event) {
    event.preventDefault();
    setNotice("");

    if (!profile?.id) {
      setNotice("Bitte logge dich erneut ein.");
      return;
    }

    const { error } = await supabase.from("group_resources").insert({
      ...resourceForm,
      group_slug: slug,
      status: "pending",
      submitted_by: profile.id,
    });

    if (error) {
      setNotice(error.message);
      return;
    }

    setResourceForm({ title: "", description: "", category: "Tools", external_url: "" });
    setNotice("Danke. Deine Ressource wurde vorgeschlagen und wartet auf Admin-Freigabe.");
  }

  if (loading) {
    return <p className="rounded-2xl bg-white p-5 text-sm font-semibold text-slate-600">Gruppe wird geladen...</p>;
  }

  return (
    <div>
      <div className="rounded-[2rem] bg-founder-600 p-6 text-white sm:p-8">
        <Link href="/community" className="text-sm font-bold text-founder-100">
          Zurück zur Community
        </Link>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-100">{group?.category}</p>
            <h1 className="mt-3 font-serif text-4xl font-bold sm:text-5xl">{group?.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-founder-50">{group?.description}</p>
          </div>
          <RankBadge rank={minRank} />
        </div>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${
              activeTab === tab ? "bg-founder-600 text-white" : "border border-slate-200 bg-white text-slate-700"
            }`}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      {notice && <p className="mt-5 rounded-2xl bg-founder-50 px-4 py-3 text-sm font-semibold text-founder-800">{notice}</p>}

      {activeTab === "Chat" && (
        <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-4 sm:p-6">
          <div className="space-y-4">
            {messages.length === 0 && (
              <p className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-600">
                Noch keine Nachrichten. Verifizierte Mitglieder können den Austausch starten.
              </p>
            )}
            {messages.map((item) => (
              <article key={item.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-founder-600 font-serif text-lg font-bold text-white">
                    {item.profile?.avatar_url ? (
                      <Image src={item.profile.avatar_url} alt="" width={44} height={44} className="h-full w-full object-cover" unoptimized />
                    ) : (
                      (item.profile?.display_name || item.profile?.username || "M").charAt(0)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-950">{item.profile?.display_name || item.profile?.username || "Mitglied"}</p>
                      <RankBadge rank={item.profile?.current_rank ?? "aspiring"} prefix="" />
                      <span className="text-xs font-semibold text-slate-400">
                        {new Date(item.created_at).toLocaleString("de-DE")}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.content}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <form onSubmit={sendMessage} className="mt-6 space-y-3">
            <textarea
              className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-founder-600 focus:ring-4 focus:ring-founder-100 disabled:bg-slate-100"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={canWrite ? "Nachricht schreiben..." : "Schreiben ist nur für verifizierte Member möglich."}
              disabled={!canWrite}
            />
            <button
              type="submit"
              disabled={!canWrite}
              className="w-full rounded-2xl bg-founder-600 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              Senden
            </button>
          </form>
        </section>
      )}

      {activeTab === "Mentoren" && (
        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {groupMentorList.map((mentor) => (
            <article key={mentor.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-founder-600 font-serif text-2xl font-bold text-white">
                {mentor.name.charAt(0)}
              </div>
              <h2 className="mt-5 font-serif text-2xl font-bold text-slate-950">{mentor.name}</h2>
              <p className="mt-3 inline-flex rounded-full bg-founder-50 px-3 py-1 text-xs font-bold text-founder-700">
                {mentor.expertise}
              </p>
              <p className="mt-4"><Stars rating={mentor.rating} /></p>
              <p className="mt-3 text-sm font-bold text-founder-600">{mentor.hourly_rate}</p>
              <Link href={`/mentoren/${mentor.id}`} className="mt-6 block w-full rounded-2xl bg-founder-600 px-5 py-3 text-center text-sm font-bold text-white">
                Profil ansehen
              </Link>
            </article>
          ))}
        </section>
      )}

      {activeTab === "Ressourcen" && (
        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-4 md:grid-cols-2">
            {resourceList.map((resource) => (
              <article key={resource.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{resource.category}</span>
                </div>
                <h2 className="mt-4 font-serif text-2xl font-bold text-slate-950">{resource.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{resource.description}</p>
                <a
                  href={resource.external_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex rounded-2xl bg-founder-600 px-4 py-2 text-sm font-bold text-white"
                >
                  Ressource öffnen
                </a>
              </article>
            ))}
          </div>
          <form onSubmit={suggestResource} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <h2 className="font-serif text-2xl font-bold text-slate-950">Ressource vorschlagen</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Links, Tools, Kurse oder Communities werden vor Veröffentlichung geprüft.</p>
            <div className="mt-5 space-y-3">
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Titel" value={resourceForm.title} onChange={(event) => setResourceForm({ ...resourceForm, title: event.target.value })} required />
              <textarea className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Beschreibung" value={resourceForm.description} onChange={(event) => setResourceForm({ ...resourceForm, description: event.target.value })} required />
              <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={resourceForm.category} onChange={(event) => setResourceForm({ ...resourceForm, category: event.target.value })}>
                {resourceCategories.map((category) => <option key={category}>{category}</option>)}
              </select>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="url" placeholder="Externer Link" value={resourceForm.external_url} onChange={(event) => setResourceForm({ ...resourceForm, external_url: event.target.value })} required />
            </div>
            <button className="mt-5 w-full rounded-2xl bg-founder-600 px-5 py-3 text-sm font-bold text-white" type="submit">
              Vorschlagen
            </button>
          </form>
        </section>
      )}

      {activeTab === "Events" && (
        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {groupEventList.map((event) => (
            <article key={event.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <RankBadge rank={event.min_rank} />
              <h2 className="mt-5 font-serif text-2xl font-bold text-slate-950">{event.title}</h2>
              <p className="mt-3 text-sm font-semibold text-slate-600">{formatDate(event.starts_at)}</p>
              <p className="mt-2 text-lg font-bold text-founder-600">{formatPrice(event.price_cents)}</p>
              <Link href="/events" className="mt-6 block rounded-2xl bg-founder-600 px-5 py-3 text-center text-sm font-bold text-white">
                Event ansehen
              </Link>
            </article>
          ))}
        </section>
      )}

      {activeTab === "Vorlagen" && (
        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {templates.map((template) => (
            <article key={template.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{template.file_type}</span>
              <h2 className="mt-4 font-serif text-2xl font-bold text-slate-950">{template.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Für Scaler+ kostenlos. Für andere Mitglieder als kostenpflichtiger Download verfügbar.
              </p>
              <p className="mt-3 text-lg font-bold text-founder-600">
                {templatesAreFree ? "Kostenlos für deinen Rang" : formatPrice(template.price_cents)}
              </p>
              <button className="mt-6 w-full rounded-2xl bg-founder-600 px-5 py-3 text-sm font-bold text-white" type="button">
                {templatesAreFree ? "Download" : "Kaufen"}
              </button>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
