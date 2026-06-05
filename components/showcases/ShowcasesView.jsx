"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Instagram,
  Linkedin,
  MessageCircle,
  Pencil,
  Plus,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import { PublicRankBadge } from "@/components/public/PublicRankBadge";
import { CockpitPage, CockpitPanel } from "@/components/cockpit/CockpitPage";
import { ShowcaseFormModal } from "@/components/showcases/ShowcaseFormModal";
import { ShowcaseImageCarousel } from "@/components/showcases/ShowcaseImageCarousel";
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

function OwnerActions({ item, onEdit, onDelete, deleting }) {
  return (
    <div className="absolute right-3 top-3 z-10 flex gap-2">
      <button
        type="button"
        aria-label="Showcase bearbeiten"
        disabled={deleting === item.id}
        onClick={(event) => {
          event.stopPropagation();
          onEdit(item);
        }}
        className="rounded-full border border-slate-200 bg-white/95 p-2 text-slate-500 shadow-sm transition hover:border-[#1a3aad]/40 hover:text-[#1a3aad] disabled:opacity-50"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Showcase löschen"
        disabled={deleting === item.id}
        onClick={(event) => {
          event.stopPropagation();
          onDelete(item);
        }}
        className="rounded-full border border-slate-200 bg-white/95 p-2 text-slate-500 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function ShowcaseCard({ item, onOpen, onUpvote, upvoting, canManage, onEdit, onDelete, deleting }) {
  return (
    <article
      className="relative cursor-pointer overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition hover:border-founder-200 hover:shadow-md"
      onClick={() => onOpen(item)}
    >
      {canManage ? <OwnerActions item={item} onEdit={onEdit} onDelete={onDelete} deleting={deleting} /> : null}
      <ShowcaseImageCarousel images={item.imageUrls ?? [item.imageUrl]} alt={item.title} />
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
        {item.previewComments?.length > 0 ? (
          <div className="space-y-1 border-t border-slate-100 pt-2">
            {item.previewComments.map((comment) => (
              <p key={comment.id} className="text-xs leading-5 text-slate-500">
                {`„${comment.content}"`}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ShowcaseDetailModal({
  item,
  onClose,
  onUpvote,
  upvoting,
  viewerId,
  canManage,
  onEdit,
  onDelete,
  deleting,
}) {
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
      setComments((current) => [...current, { ...payload.comment, isSeeded: false }]);
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
        <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
          <h2 className="min-w-0 flex-1 font-serif text-2xl font-bold text-slate-950">{item.title}</h2>
          <div className="flex shrink-0 items-center gap-2">
            {canManage ? (
              <>
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#1a3aad]/30 px-3 py-2 text-sm font-bold text-[#1a3aad] transition hover:bg-founder-50"
                >
                  <Pencil className="h-4 w-4" />
                  Bearbeiten
                </button>
                <button
                  type="button"
                  disabled={deleting === item.id}
                  onClick={() => onDelete(item)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Löschen
                </button>
              </>
            ) : null}
            <button type="button" onClick={onClose} className="rounded-full border border-slate-200 p-2 text-slate-500">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <ShowcaseImageCarousel
          images={item.imageUrls ?? [item.imageUrl]}
          alt={item.title}
          aspectClassName="aspect-video"
        />
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
                  {comment.isSeeded ? (
                    <p className="text-sm leading-6 text-slate-700">{`„${comment.content}"`}</p>
                  ) : (
                    <>
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
                    </>
                  )}
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

export function ShowcasesView() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [showcases, setShowcases] = useState([]);
  const [viewerId, setViewerId] = useState(null);
  const [canPost, setCanPost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [upvoting, setUpvoting] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const canManageShowcase = useCallback(
    (item) => Boolean(viewerId && item?.userId && item.userId === viewerId),
    [viewerId]
  );

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

  function upsertShowcase(showcase) {
    setShowcases((current) => {
      const previous = current.find((entry) => entry.id === showcase.id);
      const merged = {
        ...showcase,
        viewerHasUpvoted: previous?.viewerHasUpvoted ?? showcase.viewerHasUpvoted ?? false,
      };
      const index = current.findIndex((entry) => entry.id === showcase.id);
      if (index === -1) return [merged, ...current];
      return current.map((entry) => (entry.id === showcase.id ? merged : entry));
    });
    setSelected((current) => (current?.id === showcase.id ? { ...current, ...showcase } : current));
  }

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
      setSelected((current) =>
        current?.id === item.id ? { ...current, upvotes: payload.upvotes, viewerHasUpvoted: payload.viewerHasUpvoted } : current
      );
    }
    setUpvoting(null);
  }

  async function handleDelete(item) {
    if (!canManageShowcase(item)) return;
    if (!window.confirm(`„${item.title}" wirklich löschen? Das kann nicht rückgängig gemacht werden.`)) {
      return;
    }

    setDeleting(item.id);
    const response = await fetch(`/api/showcases/${item.id}`, { method: "DELETE" });
    const payload = await response.json().catch(() => ({}));

    if (response.ok) {
      setShowcases((current) => current.filter((entry) => entry.id !== item.id));
      setSelected((current) => (current?.id === item.id ? null : current));
      setEditing((current) => (current?.id === item.id ? null : current));
    } else {
      window.alert(payload.error ?? "Showcase konnte nicht gelöscht werden.");
    }
    setDeleting(null);
  }

  function handleEdit(item) {
    setSelected(null);
    setEditing(item);
  }

  return (
    <>
      <CockpitPage
        eyebrow="Showcases"
        title="Projekte & Launches der Community"
        description="Teile dein Produkt, deinen Shop oder dein Projekt. Bis zu 3 Bilder pro Showcase — Starter+ können posten."
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
                <ShowcaseCard
                  key={item.id}
                  item={item}
                  onOpen={setSelected}
                  onUpvote={handleUpvote}
                  upvoting={upvoting}
                  canManage={canManageShowcase(item)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  deleting={deleting}
                />
              ))}
            </div>
          )}
        </CockpitPanel>
      </CockpitPage>

      {selected && (
        <ShowcaseDetailModal
          item={selected}
          onClose={() => setSelected(null)}
          onUpvote={handleUpvote}
          upvoting={upvoting}
          viewerId={viewerId}
          canManage={canManageShowcase(selected)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          deleting={deleting}
        />
      )}
      {showCreate && (
        <ShowcaseFormModal mode="create" onClose={() => setShowCreate(false)} onSaved={upsertShowcase} />
      )}
      {editing && (
        <ShowcaseFormModal
          mode="edit"
          showcase={editing}
          onClose={() => setEditing(null)}
          onSaved={upsertShowcase}
        />
      )}
    </>
  );
}
