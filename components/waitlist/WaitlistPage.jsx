"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { LandingShell } from "@/components/landing/LandingShell";
import { WaitlistProgressBar } from "@/components/waitlist/WaitlistProgressBar";
import { WAITLIST_MAX, WAITLIST_SEED_COUNT } from "@/lib/waitlist";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [total, setTotal] = useState(WAITLIST_SEED_COUNT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/waitlist", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.total === "number") setTotal(data.total);
      })
      .catch(() => {
        /* keep seed fallback */
      });
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Anmeldung fehlgeschlagen.");
      }

      if (typeof data.total === "number") setTotal(data.total);
      setSuccess(data.message ?? "Du bist auf der Waitlist.");
      if (!data.alreadyJoined) setEmail("");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LandingShell>
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-4 pb-28 pt-10 md:px-6">
        <Link href="/" className="mb-8 inline-flex [&_p]:text-white">
          <BrandMark />
        </Link>

        <section className="rounded-xl border border-[#1a3aad]/30 bg-[#0f0f0f]/85 p-6 md:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#1a3aad]">
            Founder · Early Access
          </p>
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Die verifizierte Gründer-Community startet bald.
          </h1>
          <p className="mt-4 text-sm leading-7 text-neutral-400">
            Trag dich in die Waitlist ein. Wir geben dir als Erstes Zugang — limitiert auf {WAITLIST_MAX} Plätze.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-3">
            <label className="block">
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                E-Mail
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="deine@email.de"
                disabled={loading || total >= WAITLIST_MAX}
                className="w-full rounded-xl border border-[#1a3aad]/30 bg-[#050505] px-4 py-3.5 text-sm font-medium text-white outline-none transition placeholder:text-neutral-600 focus:border-[#1a3aad] disabled:opacity-60"
              />
            </label>

            <button
              type="submit"
              disabled={loading || total >= WAITLIST_MAX}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a3aad] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#2f61df] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Wird eingetragen…" : "Auf die Waitlist"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {error && (
            <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
              {error}
            </p>
          )}

          {success && (
            <p className="mt-4 flex items-start gap-2 rounded-xl border border-[#1a3aad]/30 bg-[#1a3aad]/10 px-4 py-3 text-sm font-semibold text-[#5b8cff]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{success}</span>
            </p>
          )}

          <p className="mt-6 text-center text-xs text-neutral-600">
            Bereits Zugang?{" "}
            <Link href="/login" className="font-semibold text-[#1a3aad] transition hover:text-[#5b8cff]">
              Einloggen
            </Link>
          </p>

          <ul className="mt-8 space-y-2 border-t border-[#1a3aad]/20 pt-6 text-sm text-neutral-400">
            <li className="flex items-start gap-2">
              <span className="text-[#1a3aad]">✓</span>
              <span>Verifizierte Unternehmer — kein Hype, echte Substanz</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1a3aad]">✓</span>
              <span>Branchen-Communities, Ressourcen & Mentoren</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1a3aad]">✓</span>
              <span>Rang-System nach echter Unternehmensgröße</span>
            </li>
          </ul>
        </section>
      </main>

      <WaitlistProgressBar total={total} max={WAITLIST_MAX} />
    </LandingShell>
  );
}
