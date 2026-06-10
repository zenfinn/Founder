"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { canManageResource, isResourceModeratorEmail } from "@/lib/founder-contact";
import { upsertResourceVote } from "@/lib/groups";
import {
  defaultResourceType,
  getResourceTypeLabel,
  getResourceTypeMeta,
  isValidResourceUrl,
  normalizeResourceUrl,
  resourceTypes,
} from "@/lib/resource-types";

const emptyForm = { title: "", url: "", type: defaultResourceType };
const SUBMIT_SUCCESS_MESSAGE = "Vielen Dank! Dein Tool wurde zur Überprüfung eingereicht.";

export function ResourceRanking({ groupId }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [user, setUser] = useState(null);
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const selectedType = getResourceTypeMeta(form.type);
  const canSubmit = Boolean(user && form.title.trim() && isValidResourceUrl(form.url) && form.type);

  async function loadResources() {
    try {
      const response = await fetch(`/api/resources/community?groupId=${encodeURIComponent(groupId)}`, {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Tools konnten nicht geladen werden.");
      }

      setResources(payload.tools ?? []);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function boot() {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      await loadResources();
    }

    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, supabase]);

  async function handleVote(resourceId, voteType) {
    if (!user) {
      setNotice("Bitte einloggen, um zu voten.");
      return;
    }

    const resource = resources.find((item) => item.id === resourceId);
    if (resource?.legacy) {
      setNotice("Für kuratierte Tools ist Voting bald verfügbar.");
      return;
    }

    setNotice("");
    setSuccess("");

    try {
      await upsertResourceVote(supabase, { resourceId, userId: user.id, voteType });
      await loadResources();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    if (!canSubmit) return;
    setNotice("");
    setSuccess("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/resources/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: groupId,
          title: form.title.trim(),
          url: normalizeResourceUrl(form.url),
          type: form.type,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Tool konnte nicht eingereicht werden.");
      }

      setForm(emptyForm);

      if (payload.live) {
        await loadResources();
        setSuccess("Tool wurde veröffentlicht.");
      } else {
        setSuccess(SUBMIT_SUCCESS_MESSAGE);
      }
    } catch (error) {
      setNotice(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(resourceId) {
    const resource = resources.find((item) => item.id === resourceId);
    if (!user) return;
    if (resource?.legacy && !isResourceModeratorEmail(user.email)) return;
    setNotice("");
    setSuccess("");
    setDeletingId(resourceId);

    try {
      const response = await fetch(`/api/resources/${resourceId}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Tool konnte nicht gelöscht werden.");
      }

      await loadResources();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="mb-4">
          <h2 className="font-serif text-2xl font-bold text-white">Community-Tools</h2>
          <p className="mt-1 text-sm leading-6 text-neutral-400">
            SaaS, Supplier, Templates und Netzwerke — kuratiert und von der Gruppe bewertet.
          </p>
        </div>

        {success && (
          <p className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300">
            {success}
          </p>
        )}
        {notice && (
          <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
            {notice}
          </p>
        )}

        <div className="space-y-3">
          {loading && (
            <p className="rounded-xl border border-[#1a3aad]/30 bg-[#0f0f0f] p-5 text-sm font-semibold text-neutral-400">
              Tools werden geladen…
            </p>
          )}
          {!loading && resources.length === 0 && (
            <p className="rounded-xl border border-[#1a3aad]/30 bg-[#0f0f0f] p-5 text-sm font-semibold text-neutral-400">
              Noch keine Tools in dieser Community.
            </p>
          )}

          {resources.map((resource, index) => {
            const typeMeta = getResourceTypeMeta(resource.type);
            const legacy = resource.legacy;
            const canDelete =
              (legacy && isResourceModeratorEmail(user?.email)) ||
              (!legacy &&
                canManageResource({
                  userEmail: user?.email,
                  userId: user?.id,
                  authorId: resource.user_id,
                }));

            return (
              <article
                key={resource.id}
                className="flex flex-col gap-4 rounded-xl border border-[#1a3aad]/30 bg-[#0f0f0f] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#1a3aad] px-3 py-1 text-xs font-bold text-white">#{index + 1}</span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${typeMeta?.badgeClass ?? "bg-white/10 text-neutral-300 ring-1 ring-white/10"}`}
                    >
                      {getResourceTypeLabel(resource.type)}
                    </span>
                    <span className="rounded-full border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
                      Score {resource.score}
                    </span>
                  </div>
                  <h3 className="mt-3 font-serif text-xl font-bold text-white">{resource.title}</h3>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-[#5b8cff]"
                  >
                    Öffnen <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleVote(resource.id, "up")}
                    disabled={legacy}
                    className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-bold transition ${
                      resource.viewerVote === "up"
                        ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
                        : "border border-white/10 text-emerald-400 hover:border-emerald-500/40"
                    } disabled:opacity-40`}
                  >
                    <ArrowUp className="h-4 w-4" />
                    {resource.upvotes}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVote(resource.id, "down")}
                    disabled={legacy}
                    className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-bold transition ${
                      resource.viewerVote === "down"
                        ? "bg-red-500/20 text-red-300 ring-1 ring-red-500/40"
                        : "border border-white/10 text-red-400 hover:border-red-500/40"
                    } disabled:opacity-40`}
                  >
                    <ArrowDown className="h-4 w-4" />
                    {resource.downvotes}
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(resource.id)}
                      disabled={deletingId === resource.id}
                      aria-label="Tool löschen"
                      className="inline-flex items-center justify-center rounded-xl border border-white/10 p-2 text-neutral-400 transition hover:border-red-500/40 hover:text-red-300 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <form
        onSubmit={handleCreate}
        className="h-fit rounded-xl border border-[#1a3aad]/30 bg-[#0f0f0f] p-5"
      >
        <div className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-[#5b8cff]" />
          <h2 className="font-serif text-xl font-bold text-white">Tool posten</h2>
        </div>

        {!user && (
          <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200">
            Bitte einloggen, um ein Tool zu teilen.
          </p>
        )}

        <div className="mt-5 space-y-3">
          <label className="block">
            <span className="text-sm font-semibold text-neutral-300">Titel</span>
            <input
              className="mt-2 w-full rounded-xl border border-[#1a3aad]/30 bg-[#050505] px-4 py-3 text-sm font-medium text-white outline-none focus:border-[#1a3aad]"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="z.B. Beste AI-Automation Stack 2026"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-neutral-300">Link</span>
            <input
              className="mt-2 w-full rounded-xl border border-[#1a3aad]/30 bg-[#050505] px-4 py-3 text-sm font-medium text-white outline-none focus:border-[#1a3aad]"
              value={form.url}
              onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
              placeholder="https://..."
              inputMode="url"
              autoComplete="url"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-neutral-300">Kategorie</span>
            <select
              className="mt-2 w-full rounded-xl border border-[#1a3aad]/30 bg-[#050505] px-4 py-3 text-sm font-medium text-white outline-none focus:border-[#1a3aad]"
              value={form.type}
              onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
            >
              {resourceTypes.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {selectedType?.hint && <p className="mt-2 text-xs leading-5 text-neutral-500">{selectedType.hint}</p>}
          </label>
        </div>

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="mt-5 w-full rounded-xl bg-[#1a3aad] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#2f61df] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Wird eingereicht…" : "Tool einreichen"}
        </button>
      </form>
    </section>
  );
}
