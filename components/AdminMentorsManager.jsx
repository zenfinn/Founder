"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { formatMentorPricing } from "@/lib/mentors";

const emptyMentor = {
  name: "",
  bio: "",
  experience: "",
  monthly_rate_cents: 0,
  sessions_per_month: 4,
  is_approved: false,
};

export function AdminMentorsManager() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [mentors, setMentors] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState(emptyMentor);
  const [message, setMessage] = useState("");

  async function load() {
    const [{ data: mentorRows, error: mentorsError }, { data: bookingRows, error: bookingsError }] = await Promise.all([
      supabase
        .from("mentors")
        .select("id,name,bio,rating,monthly_rate_cents,hourly_rate_cents,sessions_per_month,is_approved")
        .order("created_at", { ascending: false }),
      supabase.from("mentor_bookings").select("mentor_id,mentor_key,status,amount_cents,platform_fee_cents"),
    ]);

    if (mentorsError || bookingsError) {
      setMessage(mentorsError?.message ?? bookingsError?.message ?? "Fehler beim Laden.");
      return;
    }

    setMentors(mentorRows ?? []);
    setBookings(bookingRows ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createMentor(event) {
    event.preventDefault();
    setMessage("");

    const monthlyRateCents = Number(form.monthly_rate_cents) || 0;
    const sessionsPerMonth = Number(form.sessions_per_month) || 4;

    const { error } = await supabase.from("mentors").insert({
      ...form,
      monthly_rate_cents: monthlyRateCents,
      hourly_rate_cents: monthlyRateCents,
      sessions_per_month: sessionsPerMonth,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setForm(emptyMentor);
    await load();
  }

  async function toggleApproval(mentor) {
    const { error } = await supabase.from("mentors").update({ is_approved: !mentor.is_approved }).eq("id", mentor.id);
    if (error) {
      setMessage(error.message);
      return;
    }
    await load();
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
      <form onSubmit={createMentor} className="rounded-[2rem] border border-slate-200 bg-white p-5">
        <h2 className="font-serif text-2xl font-bold text-slate-950">Mentor anlegen</h2>
        <div className="mt-5 space-y-3">
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" required />
          <textarea className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Bio" />
          <textarea className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} placeholder="Erfahrung" />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="number" value={form.monthly_rate_cents} onChange={(e) => setForm({ ...form, monthly_rate_cents: e.target.value })} placeholder="Monatspreis in Cent" />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="number" min="1" max="31" value={form.sessions_per_month} onChange={(e) => setForm({ ...form, sessions_per_month: e.target.value })} placeholder="Sessions pro Monat" />
        </div>
        {message && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p>}
        <button className="mt-5 w-full rounded-2xl bg-founder-600 px-5 py-3 font-bold text-white" type="submit">Speichern</button>
      </form>

      <section className="space-y-3">
        {mentors.map((mentor) => {
          const mentorBookings = bookings.filter((booking) => booking.mentor_id === mentor.id || booking.mentor_key === mentor.id);
          const fees = mentorBookings.reduce((sum, booking) => sum + (booking.platform_fee_cents ?? 0), 0);
          return (
            <article key={mentor.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-founder-600">{mentor.is_approved ? "Freigeschaltet" : "Ausstehend"}</p>
                  <h3 className="mt-2 font-serif text-2xl font-bold text-slate-950">{mentor.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-founder-600">{formatMentorPricing(mentor)}</p>
                  <p className="mt-2 text-sm text-slate-600">{mentorBookings.length} Buchungen · {new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(fees / 100)} Provision</p>
                </div>
                <button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700" type="button" onClick={() => toggleApproval(mentor)}>
                  {mentor.is_approved ? "Deaktivieren" : "Freischalten"}
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
