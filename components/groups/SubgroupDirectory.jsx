"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Layers3, Users } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getOwnProfile } from "@/lib/profiles";
import { getGroupSubgroupsWithMembership, getListedSubgroups, joinGroupSubgroup } from "@/lib/groups";

export function SubgroupDirectory({ groupId, onBrowseAll }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subgroups, setSubgroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [joiningId, setJoiningId] = useState(null);

  const loadSubgroups = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setProfile(await getOwnProfile(supabase, currentUser.id));
      }

      const rows = await getGroupSubgroupsWithMembership(supabase, groupId, currentUser?.id);
      setSubgroups(getListedSubgroups(rows));
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }, [groupId, supabase]);

  useEffect(() => {
    setLoading(true);
    loadSubgroups();
  }, [loadSubgroups]);

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

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Layers3 className="h-5 w-5 text-founder-600" />
          <div>
            <h2 className="font-serif text-xl font-bold text-slate-950">Untergruppen entdecken</h2>
            <p className="text-sm text-slate-500">Wähle deine Lieblings-Nische und tritt bei.</p>
          </div>
        </div>
        {onBrowseAll && (
          <button
            type="button"
            onClick={onBrowseAll}
            className="text-sm font-bold text-founder-600 transition hover:text-founder-700"
          >
            Alle verwalten →
          </button>
        )}
      </div>

      {notice && <p className="mt-3 rounded-2xl bg-founder-50 px-4 py-2 text-sm font-semibold text-founder-800">{notice}</p>}

      <div className="mt-4">
        {loading && (
          <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">Untergruppen werden geladen...</p>
        )}

        {!loading && subgroups.length === 0 && (
          <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
            Noch keine öffentlichen Untergruppen. Erstelle die erste oder wechsle in den Tab „Untergruppen“.
          </p>
        )}

        {!loading && subgroups.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {subgroups.map((subgroup) => {
              const joined = subgroup.is_member || subgroup.is_owner;

              return (
                <article
                  key={subgroup.id}
                  className="flex min-w-[240px] max-w-[280px] shrink-0 flex-col rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4"
                >
                  <h3 className="font-serif text-lg font-bold text-slate-950">{subgroup.name}</h3>
                  <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-slate-600">
                    {subgroup.description || "Keine Beschreibung hinterlegt."}
                  </p>
                  <p className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-founder-600">
                    <Users className="h-3.5 w-3.5" />
                    {(subgroup.member_count ?? 0).toLocaleString("de-DE")} Mitglieder
                  </p>

                  {joined ? (
                    <span className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-700">
                      <Check className="h-3.5 w-3.5" />
                      Beigetreten
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={joiningId === subgroup.id}
                      onClick={() => handleJoin(subgroup.id)}
                      className="mt-4 rounded-xl bg-founder-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-founder-700 disabled:opacity-60"
                    >
                      {joiningId === subgroup.id ? "Beitreten..." : "Beitreten"}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
