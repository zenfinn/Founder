"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, MapPin, Plus, UserRound } from "lucide-react";
import { CockpitPage, CockpitPanel } from "@/components/cockpit/CockpitPage";
import { FeedAvatar } from "@/components/FeedAvatar";
import { RankBadge } from "@/components/RankBadge";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getOwnProfile } from "@/lib/profiles";
import { getProfileWelcomeName } from "@/lib/membership";

const emptyForm = {
  title: "",
  description: "",
  host_info: "",
  starts_at: "",
  location_text: "",
  category: "Meetup",
};

function formatMeetupDate(value) {
  if (!value) return "Datum folgt";
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "full", timeStyle: "short" }).format(new Date(value));
}

function statusLabel(status) {
  if (status === "pending") return "In Prüfung";
  if (status === "rejected") return "Abgelehnt";
  return status;
}

function MeetupCard({ meetup, showHost = true }) {
  const hostName =
    meetup.host?.display_name ||
    (meetup.host?.username ? `@${meetup.host.username}` : null) ||
    "Founder Mitglied";

  return (
    <article className="rounded-xl border border-[#1a3aad]/25 bg-[#0a0a0a]/60 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#1a3aad]/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#5b8cff]">
          {meetup.category || "Meetup"}
        </span>
        {meetup.status && meetup.status !== "approved" && (
          <span className="rounded-full border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300">
            {statusLabel(meetup.status)}
          </span>
        )}
      </div>

      <h3 className="mt-3 font-serif text-xl font-bold text-white">{meetup.title}</h3>

      <p className="mt-2 flex items-start gap-2 text-sm text-neutral-400">
        <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[#5b8cff]" />
        {formatMeetupDate(meetup.starts_at)}
      </p>

      {meetup.location_text && (
        <p className="mt-1.5 flex items-start gap-2 text-sm text-neutral-400">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#5b8cff]" />
          {meetup.location_text}
        </p>
      )}

      {meetup.description && (
        <p className="mt-3 text-sm leading-6 text-neutral-300">{meetup.description}</p>
      )}

      {meetup.host_info && (
        <div className="mt-3 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Über den Host</p>
          <p className="mt-1 text-sm leading-6 text-neutral-400">{meetup.host_info}</p>
        </div>
      )}

      {showHost && meetup.host && (
        <div className="mt-4 flex items-center gap-2 border-t border-white/8 pt-3">
          <FeedAvatar name={hostName} avatarUrl={meetup.host.avatar_url ?? ""} size={32} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{hostName}</p>
            <div className="mt-0.5">
              <RankBadge rank={meetup.host.current_rank ?? "aspiring"} />
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

export function MeetupsView() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [loggedIn, setLoggedIn] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [meetups, setMeetups] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadMeetups = useCallback(async () => {
    const response = await fetch("/api/meetups", { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error ?? "Meetups konnten nicht geladen werden.");
    }

    setMeetups(payload.meetups ?? []);
    setMine(payload.mine ?? []);
  }, []);

  useEffect(() => {
    async function boot() {
      try {
        const { data } = await supabase.auth.getSession();
        const user = data.session?.user ?? null;
        setLoggedIn(Boolean(user));

        if (user) {
          const ownProfile = await getOwnProfile(supabase, user.id);

          const hostParts = [
            ownProfile?.display_name || getProfileWelcomeName(ownProfile),
            ownProfile?.company_name,
            ownProfile?.industry,
            ownProfile?.bio,
          ].filter(Boolean);

          setForm((current) => ({
            ...current,
            host_info: hostParts.join(" · ").slice(0, 500),
          }));

          await loadMeetups();
        }
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    boot();
  }, [loadMeetups, supabase]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!loggedIn) {
      setError("Bitte logge dich ein, um ein Meetup zu planen.");
      return;
    }

    setSubmitting(true);

    const response = await fetch("/api/events/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(payload.error ?? "Meetup konnte nicht eingereicht werden.");
    } else {
      setMessage("Dein Meetup wurde eingereicht und wird geprüft. Nach Freigabe erscheint es in der Liste.");
      setForm((current) => ({
        ...emptyForm,
        host_info: current.host_info,
        category: current.category,
      }));
      await loadMeetups();
    }

    setSubmitting(false);
  }

  return (
    <CockpitPage
      eyebrow="Networking"
      title="Meetups planen"
      description="Organisiere ein Founder-Treffen — Ort, Zeit, kurze Beschreibung und Infos zu dir als Host. Nach Freigabe sehen es alle Mitglieder."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <CockpitPanel>
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-[#5b8cff]" />
            <h2 className="font-serif text-2xl font-bold text-white">Meetup erstellen</h2>
          </div>

          {!loggedIn && loggedIn !== null && (
            <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              <Link href="/login" className="font-bold text-[#5b8cff] hover:underline">
                Einloggen
              </Link>
              , um ein Meetup zu planen.
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
              {error}
            </p>
          )}
          {message && (
            <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300">
              {message}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-neutral-300">Titel</span>
              <input
                className="mt-2 w-full rounded-xl border border-[#1a3aad]/30 bg-[#050505] px-4 py-3 text-sm text-white outline-none focus:border-[#1a3aad]"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="z. B. Founder Dinner München"
                required
                disabled={!loggedIn}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-neutral-300">Wann</span>
                <input
                  type="datetime-local"
                  className="mt-2 w-full rounded-xl border border-[#1a3aad]/30 bg-[#050505] px-4 py-3 text-sm text-white outline-none focus:border-[#1a3aad]"
                  value={form.starts_at}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                  required
                  disabled={!loggedIn}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-neutral-300">Wo</span>
                <input
                  className="mt-2 w-full rounded-xl border border-[#1a3aad]/30 bg-[#050505] px-4 py-3 text-sm text-white outline-none focus:border-[#1a3aad]"
                  value={form.location_text}
                  onChange={(e) => setForm({ ...form, location_text: e.target.value })}
                  placeholder="Berlin, Online, Hybrid …"
                  required
                  disabled={!loggedIn}
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-neutral-300">Über dich (Host)</span>
              <textarea
                className="mt-2 min-h-24 w-full rounded-xl border border-[#1a3aad]/30 bg-[#050505] px-4 py-3 text-sm text-white outline-none focus:border-[#1a3aad]"
                value={form.host_info}
                onChange={(e) => setForm({ ...form, host_info: e.target.value })}
                placeholder="Wer bist du, was machst du, warum organisierst du das Meetup?"
                disabled={!loggedIn}
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-neutral-300">Kurzbeschreibung</span>
              <textarea
                className="mt-2 min-h-28 w-full rounded-xl border border-[#1a3aad]/30 bg-[#050505] px-4 py-3 text-sm text-white outline-none focus:border-[#1a3aad]"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Was passiert beim Meetup? Für wen ist es gedacht?"
                required
                disabled={!loggedIn}
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-neutral-300">Kategorie (optional)</span>
              <input
                className="mt-2 w-full rounded-xl border border-[#1a3aad]/30 bg-[#050505] px-4 py-3 text-sm text-white outline-none focus:border-[#1a3aad]"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Dinner, Workshop, Coworking …"
                disabled={!loggedIn}
              />
            </label>

            <button
              type="submit"
              disabled={submitting || !loggedIn}
              className="w-full rounded-xl bg-[#1a3aad] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#2f61df] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Wird eingereicht …" : "Meetup einreichen"}
            </button>
          </form>
        </CockpitPanel>

        <div className="grid gap-4">
          <CockpitPanel>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#5b8cff]" />
              <h2 className="font-serif text-2xl font-bold text-white">Geplante Meetups</h2>
            </div>

            {loading && <p className="mt-4 text-sm text-neutral-500">Meetups werden geladen …</p>}

            {!loading && !loggedIn && (
              <p className="mt-4 text-sm text-neutral-500">Einloggen, um Meetups zu sehen.</p>
            )}

            {!loading && loggedIn && meetups.length === 0 && (
              <p className="mt-4 text-sm text-neutral-500">Noch keine freigegebenen Meetups. Sei der Erste!</p>
            )}

            <div className="mt-4 space-y-3">
              {meetups.map((meetup) => (
                <MeetupCard key={meetup.id} meetup={meetup} />
              ))}
            </div>
          </CockpitPanel>

          {mine.length > 0 && (
            <CockpitPanel>
              <div className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-[#5b8cff]" />
                <h2 className="font-serif text-xl font-bold text-white">Deine Einreichungen</h2>
              </div>
              <div className="mt-4 space-y-3">
                {mine.map((meetup) => (
                  <MeetupCard key={meetup.id} meetup={meetup} showHost={false} />
                ))}
              </div>
            </CockpitPanel>
          )}
        </div>
      </div>
    </CockpitPage>
  );
}
