"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getOwnProfile } from "@/lib/profiles";
import { canOfferMentoring, getMentorHourlyRateCap, validateMentorHourlyRate } from "@/lib/rank-system";
import { getRankLabel } from "@/lib/founder-data";

const emptyForm = { name: "", bio: "", experience: "", hourlyRate: "" };

export function MentorOfferForm() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const rank = profile?.current_rank ?? "aspiring";
  const cap = getMentorHourlyRateCap(rank);
  const eligible = canOfferMentoring(rank);

  useEffect(() => {
    async function boot() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        setLoading(false);
        return;
      }

      const profileData = await getOwnProfile(supabase, user.id);
      setProfile({ ...profileData, id: user.id });

      const { data: existing } = await supabase
        .from("mentors")
        .select("name,bio,experience,hourly_rate_cents")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        setForm({
          name: existing.name ?? "",
          bio: existing.bio ?? "",
          experience: existing.experience ?? "",
          hourlyRate: existing.hourly_rate_cents ? String(existing.hourly_rate_cents / 100) : "",
        });
      }

      setLoading(false);
    }

    boot();
  }, [supabase]);

  function handleRateChange(value) {
    setError("");
    setForm((current) => ({ ...current, hourlyRate: value }));

    if (!value.trim()) return;
    const validation = validateMentorHourlyRate(rank, value);
    if (!validation.ok) {
      setError(validation.message);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!profile?.id) {
      setError("Bitte logge dich ein, um ein Mentor-Profil zu erstellen.");
      return;
    }

    const validation = validateMentorHourlyRate(rank, form.hourlyRate);
    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    setSubmitting(true);

    const hourlyRateCents = Math.round(Number(form.hourlyRate) * 100);
    const payload = {
      user_id: profile.id,
      name: form.name.trim(),
      bio: form.bio.trim(),
      experience: form.experience.trim(),
      hourly_rate_cents: hourlyRateCents,
      is_approved: false,
    };

    const { data: existing } = await supabase.from("mentors").select("id").eq("user_id", profile.id).maybeSingle();
    const { error: saveError } = existing?.id
      ? await supabase.from("mentors").update(payload).eq("id", existing.id)
      : await supabase.from("mentors").insert(payload);

    if (saveError) {
      setError(saveError.message);
    } else {
      setMessage("Mentor-Profil gespeichert. Nach Freigabe erscheinst du in der Liste.");
    }

    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="mt-10 rounded-[1.5rem] border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-500">
        Mentor-Profil wird geladen...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mt-10 rounded-[1.5rem] border border-slate-200 bg-white p-6">
        <h2 className="font-serif text-2xl font-bold text-slate-950">Als Mentor anbieten</h2>
        <p className="mt-2 text-sm text-slate-600">Logge dich ein, um dein Mentor-Profil anzulegen.</p>
        <Link href="/login" className="mt-4 inline-flex rounded-2xl bg-founder-600 px-5 py-3 text-sm font-bold text-white">
          Einloggen
        </Link>
      </div>
    );
  }

  if (!eligible) {
    return (
      <div className="mt-10 rounded-[1.5rem] border border-slate-200 bg-white p-6">
        <h2 className="font-serif text-2xl font-bold text-slate-950">Als Mentor anbieten</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Dein aktueller Rang <strong>{getRankLabel(rank)}</strong> berechtigt noch nicht zum Mentoring. Ab{" "}
          <strong>Builder</strong> kannst du Sessions anbieten (max. 50€/h).
        </p>
        <Link href="/profile/verify" className="mt-4 inline-flex rounded-2xl bg-founder-600 px-5 py-3 text-sm font-bold text-white">
          Rang verifizieren
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 rounded-[1.5rem] border border-slate-200 bg-white p-6">
      <h2 className="font-serif text-2xl font-bold text-slate-950">Dein Mentor-Profil</h2>
      <p className="mt-2 text-sm text-slate-600">
        Als <strong>{getRankLabel(rank)}</strong> darfst du maximal <strong>{cap}€/Stunde</strong> verlangen.
      </p>

      {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
      {message && <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{message}</p>}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="text-sm font-bold text-slate-700">Name</span>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-bold text-slate-700">Bio</span>
          <textarea
            className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
            value={form.bio}
            onChange={(event) => setForm({ ...form, bio: event.target.value })}
            required
          />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-bold text-slate-700">Erfahrung</span>
          <textarea
            className="mt-2 min-h-20 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
            value={form.experience}
            onChange={(event) => setForm({ ...form, experience: event.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Stundensatz (EUR)</span>
          <input
            type="number"
            min="1"
            max={cap}
            step="1"
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
            value={form.hourlyRate}
            onChange={(event) => handleRateChange(event.target.value)}
            placeholder={`Max. ${cap}`}
            required
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting || Boolean(error)}
        className="mt-6 rounded-2xl bg-founder-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-founder-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Speichern..." : "Mentor-Profil speichern"}
      </button>
    </form>
  );
}
