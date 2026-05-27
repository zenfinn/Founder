"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Lock, Plus, Users } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getOwnProfile } from "@/lib/profiles";
import {
  createGroupSubgroup,
  getGroupSubgroupsWithMembership,
  getJoinableSubgroups,
  getListedSubgroups,
  joinGroupSubgroup,
} from "@/lib/groups";

const visibilityOptions = [
  { value: "listed", label: "Im Gruppen-Ordner sichtbar (empfohlen)" },
  { value: "private", label: "Nur für mich sichtbar" },
];

function SubgroupCard({ subgroup, onJoin, joiningId }) {
  const joined = subgroup.is_member || subgroup.is_owner;
  const isPrivate = subgroup.visibility === "private";

  return (
    <article className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5 transition hover:border-founder-100 hover:bg-white">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold capitalize text-slate-600">
          {isPrivate ? "Privat" : "Gelistet"}
        </span>
        {isPrivate && <Lock className="h-4 w-4 text-slate-400" />}
      </div>
      <h3 className="mt-4 font-serif text-2xl font-bold text-slate-950">{subgroup.name}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{subgroup.description || "Keine Beschreibung hinterlegt."}</p>
      <p className="mt-4 text-sm font-bold text-founder-600">{(subgroup.member_count ?? 0).toLocaleString("de-DE")} Mitglieder</p>

      {joined ? (
        <span className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700">
          <Check className="h-4 w-4" />
          {subgroup.is_owner ? "Deine Untergruppe" : "Beigetreten"}
        </span>
      ) : (
        <button
          type="button"
          disabled={joiningId === subgroup.id || isPrivate}
          onClick={() => onJoin(subgroup.id)}
          className="mt-5 w-full rounded-2xl bg-founder-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-founder-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {joiningId === subgroup.id ? "Beitreten..." : "Beitreten"}
        </button>
      )}
    </article>
  );
}

export function GroupSubgroups({ groupId }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subgroups, setSubgroups] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", visibility: "listed" });
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);

  async function loadSubgroups() {
    try {
      const rows = await getGroupSubgroupsWithMembership(supabase, groupId, user?.id);
      setSubgroups(rows);
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
      if (currentUser) {
        setProfile(await getOwnProfile(supabase, currentUser.id));
      }
    }

    boot();
  }, [supabase]);

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    loadSubgroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, user?.id]);

  async function handleCreate(event) {
    event.preventDefault();
    if (!user) return;
    setNotice("");

    try {
      await createGroupSubgroup(supabase, { groupId, userId: user.id, profile, ...form });
      setForm({ name: "", description: "", visibility: "listed" });
      await loadSubgroups();
      setNotice("Untergruppe wurde erstellt und ist für andere sichtbar.");
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function handleJoin(subgroupId) {
    if (!user) return;
    setJoiningId(subgroupId);
    setNotice("");

    try {
      await joinGroupSubgroup(supabase, { subgroupId, userId: user.id, profile });
      await loadSubgroups();
      setNotice("Du bist der Untergruppe beigetreten.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setJoiningId(null);
    }
  }

  const listedSubgroups = getListedSubgroups(subgroups);
  const mySubgroups = subgroups.filter((subgroup) => subgroup.is_owner || subgroup.is_member);
  const discoverSubgroups = listedSubgroups.filter((subgroup) => !subgroup.is_member && !subgroup.is_owner);

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-founder-600" />
          <h2 className="font-serif text-3xl font-bold text-slate-950">Untergruppen</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Finde Nischen wie Sneaker, Vintage oder High-Ticket – oder erstelle deine eigene Untergruppe für deine
          Lieblings-Community.
        </p>

        {notice && <p className="mt-4 rounded-2xl bg-founder-50 px-4 py-3 text-sm font-semibold text-founder-800">{notice}</p>}

        {loading && <p className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-600">Untergruppen werden geladen...</p>}

        {!loading && (
          <div className="mt-6 space-y-8">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-founder-600">Zum Beitreten</h3>
              {discoverSubgroups.length === 0 ? (
                <p className="mt-3 rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-600">
                  {listedSubgroups.length === 0
                    ? "Noch keine gelisteten Untergruppen. Erstelle die erste für diese Gruppe."
                    : "Du bist bereits allen öffentlichen Untergruppen beigetreten."}
                </p>
              ) : (
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  {discoverSubgroups.map((subgroup) => (
                    <SubgroupCard key={subgroup.id} subgroup={subgroup} onJoin={handleJoin} joiningId={joiningId} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-founder-600">Deine Untergruppen</h3>
              {mySubgroups.length === 0 ? (
                <p className="mt-3 rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-600">
                  Du bist noch keiner Untergruppe beigetreten.
                </p>
              ) : (
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  {mySubgroups.map((subgroup) => (
                    <SubgroupCard key={subgroup.id} subgroup={subgroup} onJoin={handleJoin} joiningId={joiningId} />
                  ))}
                </div>
              )}
            </div>

            {getJoinableSubgroups(subgroups).length === 0 && subgroups.length === 0 && (
              <p className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-600">
                Noch keine Untergruppen in dieser Gruppe.
              </p>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleCreate} className="h-fit rounded-[2rem] border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-founder-600" />
          <h2 className="font-serif text-2xl font-bold text-slate-950">Untergruppe erstellen</h2>
        </div>
        <div className="mt-5 space-y-3">
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="z.B. Sneaker, Vintage, High-Ticket"
            required
          />
          <textarea
            className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Kurz beschreiben, worum es geht"
          />
          <select
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
            value={form.visibility}
            onChange={(event) => setForm({ ...form, visibility: event.target.value })}
          >
            {visibilityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="mt-5 w-full rounded-2xl bg-founder-600 px-5 py-3 text-sm font-bold text-white">
          Erstellen
        </button>
      </form>
    </section>
  );
}
