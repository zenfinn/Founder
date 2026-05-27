"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const emptyForm = {
  title: "",
  description: "",
  starts_at: "",
  location_text: "",
  category: "",
};

export function EventSubmissionForm() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [loggedIn, setLoggedIn] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(Boolean(data.session?.user));
    });
  }, [supabase]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!loggedIn) {
      setError("Bitte logge dich ein, um ein Event einzureichen.");
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
      setError(payload.error ?? "Einreichung fehlgeschlagen.");
    } else {
      setMessage("Danke! Dein Event-Vorschlag wurde eingereicht. Wir melden uns nach Prüfung.");
      setForm(emptyForm);
    }

    setSubmitting(false);
  }

  return (
    <form
      id="vorschlagen"
      onSubmit={handleSubmit}
      className="rounded-[1.5rem] border border-founder-200 bg-white p-6 shadow-sm shadow-founder-600/5"
    >
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-600">Event vorschlagen</p>
      <h2 className="mt-3 font-serif text-3xl font-bold text-slate-950">Dein Event einreichen</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        Schlage ein Workshop, Dinner oder Founder Call vor. Nach Freigabe erscheint es im Kalender — du bekommst eine
        Rückmeldung per E-Mail.
      </p>

      {!loggedIn && loggedIn !== null && (
        <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
          <Link href="/login" className="font-bold text-founder-600">
            Einloggen
          </Link>
          , um ein Event einzureichen.
        </p>
      )}

      {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
      {message && <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{message}</p>}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="text-sm font-bold text-slate-700">Event-Titel</span>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="z. B. E-Commerce Dinner Berlin"
            required
            disabled={!loggedIn}
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Kategorie</span>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
            placeholder="Workshop, Dinner, Konferenz"
            disabled={!loggedIn}
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Geplantes Datum</span>
          <input
            type="datetime-local"
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
            value={form.starts_at}
            onChange={(event) => setForm({ ...form, starts_at: event.target.value })}
            disabled={!loggedIn}
          />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-bold text-slate-700">Ort / Format</span>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
            value={form.location_text}
            onChange={(event) => setForm({ ...form, location_text: event.target.value })}
            placeholder="Online, Berlin, Hybrid"
            disabled={!loggedIn}
          />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-bold text-slate-700">Beschreibung</span>
          <textarea
            className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Was passiert beim Event? Für wen ist es gedacht?"
            disabled={!loggedIn}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting || !loggedIn}
        className="mt-6 rounded-2xl bg-founder-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-founder-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Wird eingereicht..." : "Event zur Freigabe einreichen"}
      </button>
    </form>
  );
}
