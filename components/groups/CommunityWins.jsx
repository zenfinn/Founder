"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Trophy } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getCommunityWins, getProfilesByIds, postCommunityWin } from "@/lib/groups";

function attachProfiles(wins, profiles) {
  return wins.map((win) => ({
    ...win,
    profile: profiles.find((profile) => profile.id === win.user_id),
  }));
}

export function CommunityWins({ groupId }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [user, setUser] = useState(null);
  const [wins, setWins] = useState([]);
  const [form, setForm] = useState({ title: "", imageUrl: "" });
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadWins() {
    try {
      const rows = await getCommunityWins(supabase, groupId);
      const profiles = await getProfilesByIds(supabase, rows.map((win) => win.user_id));
      setWins(attachProfiles(rows, profiles));
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function boot() {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      await loadWins();
    }

    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, supabase]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!user) return;
    setNotice("");

    try {
      await postCommunityWin(supabase, { groupId, userId: user.id, title: form.title.trim(), imageUrl: form.imageUrl.trim() });
      setForm({ title: "", imageUrl: "" });
      await loadWins();
    } catch (error) {
      setNotice(error.message);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-founder-600" />
          <h2 className="font-serif text-3xl font-bold text-slate-950">Community Wins</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">Erfolge, Launches, Screenshots und echte Momentum-Posts aus der Gruppe.</p>

        {notice && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{notice}</p>}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {loading && <p className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-600">Wins werden geladen...</p>}
          {!loading && wins.length === 0 && (
            <p className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-600">Noch keine Wins. Poste den ersten Erfolg.</p>
          )}

          {wins.map((win) => (
            <article key={win.id} className="overflow-hidden rounded-[1.5rem] bg-slate-50">
              {win.image_url && (
                <div className="relative h-48">
                  <Image src={win.image_url} alt="" fill className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" unoptimized />
                </div>
              )}
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-founder-600">
                  {new Date(win.created_at).toLocaleDateString("de-DE")}
                </p>
                <h3 className="mt-2 font-serif text-2xl font-bold text-slate-950">{win.title}</h3>
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Von {win.profile?.display_name || win.profile?.username || "Founder Mitglied"}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="h-fit rounded-[2rem] border border-slate-200 bg-white p-5">
        <h2 className="font-serif text-2xl font-bold text-slate-950">Win posten</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Für den MVP reicht eine Bild-URL. Später ersetzen wir das durch Supabase Storage Upload.</p>
        <div className="mt-5 space-y-3">
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="z.B. Erster 10k Monat erreicht" required />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} placeholder="Screenshot URL optional" type="url" />
        </div>
        <button type="submit" className="mt-5 w-full rounded-2xl bg-founder-600 px-5 py-3 text-sm font-bold text-white">
          Win veröffentlichen
        </button>
      </form>
    </section>
  );
}
