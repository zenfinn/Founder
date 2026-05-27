"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function AdminExternalGroupsManager() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [groups, setGroups] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    const [{ data: groupRows, error: groupError }, { data: ratingRows, error: ratingError }] = await Promise.all([
      supabase
        .from("external_groups")
        .select("id,group_slug,name,description,category,member_count,average_rating,external_url,status,created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("external_group_ratings")
        .select("id,external_group_id,user_id,rating,created_at")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (groupError || ratingError) {
      setMessage(groupError?.message ?? ratingError?.message ?? "Fehler beim Laden.");
      return;
    }

    setGroups(groupRows ?? []);
    setRatings(ratingRows ?? []);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function updateGroup(id, patch) {
    const { error } = await supabase.from("external_groups").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
    setMessage(error ? error.message : "Gruppe aktualisiert.");
    if (!error) await loadData();
  }

  async function deleteGroup(id) {
    const { error } = await supabase.from("external_groups").delete().eq("id", id);
    setMessage(error ? error.message : "Gruppe entfernt.");
    if (!error) await loadData();
  }

  async function deleteRating(id) {
    const { error } = await supabase.from("external_group_ratings").delete().eq("id", id);
    setMessage(error ? error.message : "Bewertung entfernt.");
    if (!error) await loadData();
  }

  return (
    <div className="mt-8 space-y-6">
      {message && <p className="rounded-2xl bg-founder-50 px-4 py-3 text-sm font-semibold text-founder-800">{message}</p>}
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
        <h2 className="font-serif text-3xl font-bold text-slate-950">Externe Gruppen</h2>
        <div className="mt-5 grid gap-4">
          {groups.map((group) => (
            <article key={group.id} className="rounded-[1.5rem] bg-slate-50 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">{group.group_slug}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">{group.category}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">{group.status}</span>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">★ {Number(group.average_rating ?? 0).toFixed(1)}</span>
                  </div>
                  <h3 className="mt-3 font-serif text-2xl font-bold text-slate-950">{group.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{group.description}</p>
                  <p className="mt-2 text-sm font-semibold text-founder-600">{Number(group.member_count ?? 0).toLocaleString("de-DE")} Mitglieder</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => updateGroup(group.id, { status: "approved" })} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Genehmigen</button>
                  <button type="button" onClick={() => updateGroup(group.id, { status: "rejected" })} className="rounded-full bg-amber-600 px-4 py-2 text-sm font-bold text-white">Ablehnen</button>
                  <button type="button" onClick={() => deleteGroup(group.id)} className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white">Entfernen</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
        <h2 className="font-serif text-3xl font-bold text-slate-950">Bewertungen moderieren</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {ratings.map((rating) => (
            <article key={rating.id} className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-950">Bewertung: {rating.rating} Sterne</p>
              <p className="mt-1 text-xs text-slate-500">External Group: {rating.external_group_id}</p>
              <button type="button" onClick={() => deleteRating(rating.id)} className="mt-3 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white">
                Bewertung löschen
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
