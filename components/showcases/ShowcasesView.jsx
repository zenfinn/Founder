"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ExternalLink,
  Instagram,
  Linkedin,
  MessageCircle,
  Plus,
  ThumbsUp,
  Upload,
  X,
} from "lucide-react";
import { PublicRankBadge } from "@/components/public/PublicRankBadge";
import { CockpitPage, CockpitPanel } from "@/components/cockpit/CockpitPage";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { canPostShowcase } from "@/lib/showcases";
import { getOwnProfile } from "@/lib/profiles";

/** Poster names hidden until more members post showcases. */
const SHOW_SHOWCASE_POSTER = false;

function formatDate(value) {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function SocialLink({ href, label, Icon }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 transition hover:bg-founder-50 hover:text-founder-700"
      onClick={(event) => event.stopPropagation()}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}

function ShowcaseCard({ item, onOpen, onUpvote, upvoting }) {
  return (
    <article
      className="cursor-pointer overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition hover:border-founder-200 hover:shadow-md"
      onClick={() => onOpen(item)}
    >
      <div className="relative aspect-[4/3] bg-slate-100">
        <Image src={item.imageUrl} alt={item.title} fill className="object-cover" unoptimized />
      </div>
      <div className="space-y-3 p-4">
        <h2 className="font-serif text-xl font-bold text-slate-950">{item.title}</h2>
        <p className="line-clamp-2 text-sm leading-6 text-slate-600">{item.description}</p>
        {item.websiteUrl && (
          <a
            href={item.websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm font-bold text-founder-600"
            onClick={(event) => event.stopPropagation()}
          >
            <ExternalLink className="h-4 w-4" />
            Website
          </a>
        )}
        <div className="flex flex-wrap gap-2">
          <SocialLink href={item.instagramUrl} label="Instagram" Icon={Instagram} />
          <SocialLink href={item.tiktokUrl} label="TikTok" Icon={ExternalLink} />
          <SocialLink href={item.linkedinUrl} label="LinkedIn" Icon={Linkedin} />
        </div>
        <div
          className={`flex items-center gap-3 border-t border-slate-100 pt-3 ${
            SHOW_SHOWCASE_POSTER ? "justify-between" : "justify-end"
          }`}
        >
          {SHOW_SHOWCASE_POSTER ? (
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-founder-600 text-xs font-bold text-white">
                {(item.author?.displayName ?? "F").charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{item.author?.displayName ?? "Founder"}</p>
                <PublicRankBadge rank={item.author?.rank ?? "aspiring"} size="sm" />
              </div>
            </div>
          ) : null}
          <p className="shrink-0 text-xs font-semibold text-slate-400">{formatDate(item.createdAt)}</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onUpvote(item);
            }}
            disabled={upvoting === item.id}
            className={`inline-flex items-center gap-1.5 text-sm font-bold transition ${
              item.viewerHasUpvoted ? "text-founder-600" : "text-slate-500 hover:text-founder-600"
            }`}
          >
            <ThumbsUp className={`h-4 w-4 ${item.viewerHasUpvoted ? "fill-current" : ""}`} />
            {item.upvotes}
          </button>
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500">
            <MessageCircle className="h-4 w-4" />
            {item.commentCount}
          </span>
        </div>
      </div>
    </article>
  );
}

function ShowcaseDetailModal({ item, onClose, onUpvote, upvoting, viewerId }) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadComments = useCallback(async () => {
    const response = await fetch(`/api/showcases/${item.id}/comments`, { cache: "no-store" });
    const payload = await response.json();
    if (response.ok) setComments(payload.comments ?? []);
  }, [item.id]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  async function handleComment(event) {
    event.preventDefault();
    if (!viewerId) return;
    setSubmitting(true);
    const response = await fetch(`/api/showcases/${item.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentText }),
    });
    const payload = await response.json();
    if (response.ok) {
      setComments((current) => [...current, payload.comment]);
      setCommentText("");
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-4 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <h2 className="font-serif text-2xl font-bold text-slate-950">{item.title}</h2>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 p-2 text-slate-500">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="relative aspect-video bg-slate-100">
          <Image src={item.imageUrl} alt={item.title} fill className="object-cover" unoptimized />
        </div>
        <div className="space-y-4 p-5 sm:p-6">
          <p className="text-base leading-7 text-slate-700">{item.description}</p>
          {item.websiteUrl && (
            <a href={item.websiteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-bold text-founder-600">
              <ExternalLink className="h-4 w-4" />
              {item.websiteUrl}
            </a>
          )}
          <div className="flex flex-wrap gap-2">
            <SocialLink href={item.instagramUrl} label="Instagram" Icon={Instagram} />
            <SocialLink href={item.tiktokUrl} label="TikTok" Icon={ExternalLink} />
            <SocialLink href={item.linkedinUrl} label="LinkedIn" Icon={Linkedin} />
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onUpvote(item)}
              disabled={upvoting === item.id}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold ${
                item.viewerHasUpvoted ? "bg-founder-50 text-founder-700" : "bg-slate-100 text-slate-700"
              }`}
            >
              <ThumbsUp className={`h-4 w-4 ${item.viewerHasUpvoted ? "fill-current" : ""}`} />
              {item.upvotes} Upvotes
            </button>
          </div>
          <section>
            <h3 className="font-serif text-xl font-bold text-slate-950">Kommentare</h3>
            <div className="mt-4 space-y-3">
              {comments.map((comment) => (
                <article key={comment.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-founder-600 text-xs font-bold text-white">
                      {comment.author.displayName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{comment.author.displayName}</p>
                      <PublicRankBadge rank={comment.author.rank} size="sm" />
                    </div>
                    <p className="ml-auto text-xs text-slate-400">{formatDate(comment.createdAt)}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{comment.content}</p>
                </article>
              ))}
            </div>
            {viewerId ? (
              <form onSubmit={handleComment} className="mt-4 flex gap-2">
                <input
                  className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
                  placeholder="Kommentar schreiben…"
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  required
                />
                <button type="submit" disabled={submitting} className="rounded-2xl bg-founder-600 px-4 py-3 text-sm font-bold text-white">
                  Senden
                </button>
              </form>
            ) : (
              <p className="mt-4 text-sm font-semibold text-slate-500">
                <Link href="/login" className="text-founder-600">
                  Einloggen
                </Link>{" "}
                zum Kommentieren.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function CreateShowcaseForm({ onCreated, onClose }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    website_url: "",
    instagram_url: "",
    tiktok_url: "",
    linkedin_url: "",
  });
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/showcases/upload", { method: "POST", body });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Upload fehlgeschlagen.");
    } else {
      setImageUrl(payload.image_url);
    }
    setUploading(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const response = await fetch("/api/showcases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, image_url: imageUrl }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Showcase konnte nicht erstellt werden.");
    } else {
      onCreated(payload.showcase);
      onClose();
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onClick={onClose}>
      <form
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-slate-950">Showcase posten</h2>
          <button type="button" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Bild</span>
            <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-sm font-bold text-slate-600">
              <Upload className="h-4 w-4" />
              {uploading ? "Wird hochgeladen…" : imageUrl ? "Bild ausgewählt ✓" : "Bild hochladen"}
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
          </label>
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" placeholder="Titel" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <textarea className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" placeholder="Beschreibung (max. 150 Zeichen)" maxLength={150} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" placeholder="Website URL" value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" placeholder="Instagram URL" value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" placeholder="TikTok URL" value={form.tiktok_url} onChange={(e) => setForm({ ...form, tiktok_url: e.target.value })} />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" placeholder="LinkedIn URL" value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} />
        </div>
        <button type="submit" disabled={submitting || !imageUrl} className="mt-6 w-full rounded-2xl bg-founder-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
          {submitting ? "Wird veröffentlicht…" : "Showcase veröffentlichen"}
        </button>
      </form>
    </div>
  );
}

export function ShowcasesView() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [showcases, setShowcases] = useState([]);
  const [viewerId, setViewerId] = useState(null);
  const [canPost, setCanPost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [upvoting, setUpvoting] = useState(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/showcases", { cache: "no-store" });
    const payload = await response.json();
    if (response.ok) {
      setShowcases(payload.showcases ?? []);
      setViewerId(payload.viewerId ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) return;
      const profile = await getOwnProfile(supabase, user.id);
      setCanPost(canPostShowcase(profile?.current_rank ?? "aspiring"));
    });
  }, [load, supabase]);

  async function handleUpvote(item) {
    if (!viewerId) {
      window.location.href = "/login";
      return;
    }
    setUpvoting(item.id);
    const response = await fetch(`/api/showcases/${item.id}/upvote`, { method: "POST" });
    const payload = await response.json();
    if (response.ok) {
      const updater = (current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, upvotes: payload.upvotes, viewerHasUpvoted: payload.viewerHasUpvoted } : entry
        );
      setShowcases(updater);
      setSelected((current) => (current?.id === item.id ? { ...current, upvotes: payload.upvotes, viewerHasUpvoted: payload.viewerHasUpvoted } : current));
    }
    setUpvoting(null);
  }

  return (
    <>
      <CockpitPage
        eyebrow="Showcases"
        title="Projekte & Launches der Community"
        description="Teile dein Produkt, deinen Shop oder dein Projekt. Starter+ können posten – alle können liken und kommentieren."
      >
        <div className="flex flex-wrap justify-end gap-2">
          {canPost ? (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1a3aad] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#2f61df]"
            >
              <Plus className="h-4 w-4" />
              Showcase posten
            </button>
          ) : viewerId ? (
            <Link href="/profile/verify" className="rounded-xl border border-[#1a3aad]/40 px-5 py-3 text-sm font-bold text-neutral-200">
              Ab Starter posten
            </Link>
          ) : (
            <Link href="/login" className="rounded-xl bg-[#1a3aad] px-5 py-3 text-sm font-bold text-white">
              Einloggen
            </Link>
          )}
        </div>

        <CockpitPanel>
          {loading ? (
            <p className="text-sm font-semibold text-neutral-400">Showcases werden geladen…</p>
          ) : showcases.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#1a3aad]/30 p-10 text-center">
              <p className="font-serif text-2xl font-bold text-white">Noch keine Showcases</p>
              <p className="mt-2 text-sm text-neutral-400">Sei der Erste, der ein Projekt teilt.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {showcases.map((item) => (
                <ShowcaseCard key={item.id} item={item} onOpen={setSelected} onUpvote={handleUpvote} upvoting={upvoting} />
              ))}
            </div>
          )}
        </CockpitPanel>
      </CockpitPage>

      {selected && <ShowcaseDetailModal item={selected} onClose={() => setSelected(null)} onUpvote={handleUpvote} upvoting={upvoting} viewerId={viewerId} />}
      {showCreate && (
        <CreateShowcaseForm
          onClose={() => setShowCreate(false)}
          onCreated={(showcase) => setShowcases((current) => [showcase, ...current])}
        />
      )}
    </>
  );
}
