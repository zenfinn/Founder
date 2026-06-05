"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { canManageResource } from "@/lib/founder-contact";
import { getResourceRankings, upsertResourceVote } from "@/lib/groups";
import {
  defaultResourceType,
  getResourceTypeLabel,
  getResourceTypeMeta,
  isValidResourceUrl,
  normalizeResourceUrl,
  resourceTypes,
} from "@/lib/resource-types";

const emptyForm = { title: "", url: "", type: defaultResourceType };
const SUBMIT_SUCCESS_MESSAGE = "Vielen Dank! Deine Ressource wurde zur Überprüfung eingereicht.";

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

  async function loadResources(currentUser = user) {
    try {
      const rows = await getResourceRankings(supabase, groupId, { viewerId: currentUser?.id ?? null });
      setResources(rows);
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
      await loadResources(currentUser);
    }

    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, supabase]);

  async function handleVote(resourceId, voteType) {
    if (!user) {
      setNotice("Bitte einloggen, um zu voten.");
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
        throw new Error(payload.error ?? "Ressource konnte nicht eingereicht werden.");
      }

      setForm(emptyForm);

      if (payload.live) {
        await loadResources();
        setSuccess("Ressource wurde veröffentlicht.");
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
    if (!user) return;
    setNotice("");
    setSuccess("");
    setDeletingId(resourceId);

    try {
      const response = await fetch(`/api/resources/${resourceId}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Ressource konnte nicht gelöscht werden.");
      }

      await loadResources();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-3xl font-bold text-slate-950">Premium-Ressourcen</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Kuratierte Founder-Ressourcen: SaaS, Blueprints, Supplier, Media & Communities — bewertet von der Gruppe.
            </p>
          </div>
        </div>

        {success && (
          <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{success}</p>
        )}
        {notice && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{notice}</p>}

        <div className="mt-6 space-y-3">
          {loading && <p className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-600">Ressourcen werden geladen...</p>}
          {!loading && resources.length === 0 && (
            <p className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-600">Noch keine Ressourcen in dieser Gruppe.</p>
          )}

          {resources.map((resource, index) => {
            const typeMeta = getResourceTypeMeta(resource.type);
            const canDelete = canManageResource({
              userEmail: user?.email,
              userId: user?.id,
              authorId: resource.user_id,
            });

            return (
              <article key={resource.id} className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-founder-600 px-3 py-1 text-xs font-bold text-white">#{index + 1}</span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${typeMeta?.badgeClass ?? "bg-white text-slate-700"}`}
                    >
                      {getResourceTypeLabel(resource.type)}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Score {resource.score}</span>
                  </div>
                  <h3 className="mt-3 font-serif text-2xl font-bold text-slate-950">{resource.title}</h3>
                  <a href={resource.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-founder-600">
                    Öffnen <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleVote(resource.id, "up")}
                    className={`inline-flex items-center gap-1 rounded-2xl px-4 py-2 text-sm font-bold ${
                      resource.viewerVote === "up"
                        ? "bg-emerald-100 text-emerald-800 ring-2 ring-emerald-300"
                        : "bg-white text-emerald-700"
                    }`}
                  >
                    <ArrowUp className="h-4 w-4" />
                    {resource.upvotes}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVote(resource.id, "down")}
                    className={`inline-flex items-center gap-1 rounded-2xl px-4 py-2 text-sm font-bold ${
                      resource.viewerVote === "down"
                        ? "bg-red-100 text-red-800 ring-2 ring-red-300"
                        : "bg-white text-red-700"
                    }`}
                  >
                    <ArrowDown className="h-4 w-4" />
                    {resource.downvotes}
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(resource.id)}
                      disabled={deletingId === resource.id}
                      aria-label="Ressource löschen"
                      className="inline-flex items-center justify-center rounded-2xl p-2 text-slate-400 transition hover:bg-white hover:text-red-600 disabled:opacity-50"
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

      <form onSubmit={handleCreate} className="h-fit rounded-[2rem] border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-founder-600" />
          <h2 className="font-serif text-2xl font-bold text-slate-950">Ressource posten</h2>
        </div>

        {!user && (
          <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            Bitte einloggen, um eine Ressource zu erstellen.
          </p>
        )}

        <div className="mt-5 space-y-3">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Titel</span>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="z.B. Beste AI-Automation Stack 2026"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Link</span>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
              value={form.url}
              onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
              placeholder="https://..."
              inputMode="url"
              autoComplete="url"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Kategorie</span>
            <select
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
              value={form.type}
              onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
            >
              {resourceTypes.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {selectedType?.hint && (
              <p className="mt-2 text-xs leading-5 text-slate-500">{selectedType.hint}</p>
            )}
          </label>
        </div>

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="mt-5 w-full rounded-2xl bg-founder-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-founder-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          {submitting ? "Wird eingereicht..." : "Ressource einreichen"}
        </button>
      </form>
    </section>
  );
}
