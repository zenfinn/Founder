"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getOwnProfile } from "@/lib/profiles";
import { canOfferMentoring, getMentorMonthlyRateCap, validateMentorMonthlyRate } from "@/lib/rank-system";
import { getMentorMonthlyRateCents, getMentorSessionsPerMonth, validateMentorSessionsPerMonth } from "@/lib/mentors";
import { getRankLabel } from "@/lib/founder-data";

const emptyForm = { name: "", bio: "", experience: "", monthlyRate: "", sessionsPerMonth: "4" };

export function MentorOfferForm() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const rank = profile?.current_rank ?? "aspiring";
  const cap = getMentorMonthlyRateCap(rank);
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
        .select("name,bio,experience,monthly_rate_cents,hourly_rate_cents,sessions_per_month")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const monthlyCents = getMentorMonthlyRateCents(existing);
        setForm({
          name: existing.name ?? "",
          bio: existing.bio ?? "",
          experience: existing.experience ?? "",
          monthlyRate: monthlyCents ? String(monthlyCents / 100) : "",
          sessionsPerMonth: String(getMentorSessionsPerMonth(existing)),
        });
      }

      setLoading(false);
    }

    boot();
  }, [supabase]);

  function handleRateChange(value) {
    setError("");
    setForm((current) => ({ ...current, monthlyRate: value }));

    if (!value.trim()) return;
    const validation = validateMentorMonthlyRate(rank, value);
    if (!validation.ok) {
      setError(validation.message);
    }
  }

  function handleSessionsChange(value) {
    setError("");
    setForm((current) => ({ ...current, sessionsPerMonth: value }));

    if (!value.trim()) return;
    const validation = validateMentorSessionsPerMonth(value);
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

    const rateValidation = validateMentorMonthlyRate(rank, form.monthlyRate);
    if (!rateValidation.ok) {
      setError(rateValidation.message);
      return;
    }

    const sessionsValidation = validateMentorSessionsPerMonth(form.sessionsPerMonth);
    if (!sessionsValidation.ok) {
      setError(sessionsValidation.message);
      return;
    }

    setSubmitting(true);

    const monthlyRateCents = Math.round(Number(form.monthlyRate) * 100);
    const payload = {
      user_id: profile.id,
      name: form.name.trim(),
      bio: form.bio.trim(),
      experience: form.experience.trim(),
      monthly_rate_cents: monthlyRateCents,
      hourly_rate_cents: monthlyRateCents,
      sessions_per_month: sessionsValidation.value,
      is_approved: false,
    };

    const { data: existing } = await supabase.from("mentors").select("id").eq("user_id", profile.id).maybeSingle();
    const { error: saveError } = existing?.id
      ? await supabase.from("mentors").update(payload).eq("id", existing.id)
      : await supabase.from("mentors").insert(payload);

    if (saveError) {
      setError(saveError.message);
    } else {
      setMessage("Bewerbung eingereicht. Nach Freigabe erscheinst du in der Mentor-Liste.");
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
          <strong>Builder</strong> kannst du Sessions anbieten (max. 50€/Monat).
        </p>
        <Link href="/profile/verify" className="mt-4 inline-flex rounded-2xl bg-founder-600 px-5 py-3 text-sm font-bold text-white">
          Rang verifizieren
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 rounded-[1.5rem] border border-slate-200 bg-white p-6">
      <h2 className="font-serif text-2xl font-bold text-slate-950">Als Mentor bewerben</h2>
      <p className="mt-2 text-sm text-slate-600">
        Als <strong>{getRankLabel(rank)}</strong> darfst du maximal <strong>{cap}€/Monat</strong> verlangen und musst
        angeben, wie viele Sessions du pro Monat anbietest.
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
          <span className="text-sm font-bold text-slate-700">Monatspreis (EUR)</span>
          <input
            type="number"
            min="1"
            max={cap}
            step="1"
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
            value={form.monthlyRate}
            onChange={(event) => handleRateChange(event.target.value)}
            placeholder={`Max. ${cap}`}
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Sessions pro Monat</span>
          <input
            type="number"
            min="1"
            max="31"
            step="1"
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
            value={form.sessionsPerMonth}
            onChange={(event) => handleSessionsChange(event.target.value)}
            placeholder="z. B. 4"
            required
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting || Boolean(error)}
        className="mt-6 rounded-2xl bg-founder-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-founder-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Wird eingereicht..." : "Als Mentor bewerben"}
      </button>
    </form>
  );
}
