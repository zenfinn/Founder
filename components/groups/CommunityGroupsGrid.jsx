"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CommunityCategoryIcon } from "@/components/community/CommunityCategoryIcon";
import { Lock, Search, Users } from "lucide-react";
import { getMembershipLimitMessage } from "@/lib/membership";

export function CommunityGroupsGrid({ initialPayload = null }) {
  const router = useRouter();
  const [communities, setCommunities] = useState(initialPayload?.communities ?? []);
  const [proMember, setProMember] = useState(initialPayload?.proMember ?? false);
  const [canJoinMore, setCanJoinMore] = useState(initialPayload?.canJoinMore ?? true);
  const [membershipCount, setMembershipCount] = useState(initialPayload?.membershipCount ?? 0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(!initialPayload);
  const [joiningId, setJoiningId] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function loadCommunities() {
      try {
        const response = await fetch("/api/communities", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Communities konnten nicht geladen werden.");
        }

        setCommunities(payload.communities ?? []);
        setProMember(Boolean(payload.proMember));
        setCanJoinMore(Boolean(payload.canJoinMore));
        setMembershipCount(payload.membershipCount ?? 0);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    if (!initialPayload) {
      loadCommunities();
    }
  }, [initialPayload]);

  async function handleJoin(groupId) {
    setJoiningId(groupId);
    setNotice("");

    try {
      const response = await fetch(`/api/communities/${groupId}/join`, { method: "POST" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Beitritt fehlgeschlagen.");
      }

      setCommunities((current) =>
        current.map((group) => (group.id === groupId ? { ...group, is_member: true, can_join: false } : group))
      );
      setMembershipCount((count) => count + 1);
      setNotice(`Du bist "${payload.groupName}" beigetreten.`);
      router.push(`/community/${groupId}`);
    } catch (joinError) {
      setNotice(joinError.message);
    } finally {
      setJoiningId(null);
    }
  }

  const filteredCommunities = communities.filter((group) => {
    if (!query.trim()) return true;
    const needle = query.trim().toLowerCase();
    return (
      group.name?.toLowerCase().includes(needle) ||
      group.category?.toLowerCase().includes(needle) ||
      group.description?.toLowerCase().includes(needle)
    );
  });

  if (loading) {
    return (
      <p className="mt-8 rounded-[1.5rem] border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600">
        Communities werden geladen...
      </p>
    );
  }

  if (error) {
    return (
      <p className="mt-8 rounded-[1.5rem] bg-red-50 p-5 text-sm font-semibold text-red-700">
        {error}
        <span className="mt-2 block text-xs font-medium text-red-600/80">
          Tipp: Migration 034 in Supabase ausführen, falls die Tabelle noch leer ist.
        </span>
      </p>
    );
  }

  return (
    <div className="mt-0">
      {!proMember && (
        <p className="mb-4 rounded-2xl border border-founder-200 bg-founder-50 px-4 py-3 text-sm font-semibold text-founder-800">
          Basic: 1 Community + 1 Untergruppe. Tools nur mit Founder Pro.
          {!canJoinMore && membershipCount >= 1 ? ` ${getMembershipLimitMessage("community")}` : ""}
        </p>
      )}

      {notice && (
        <p className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</p>
      )}

      <label className="relative mb-5 block">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-founder-600 focus:ring-4 focus:ring-founder-100"
          placeholder="Community suchen..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredCommunities.map((group) => (
          <article
            key={group.id}
            className="group flex h-full flex-col rounded-[1.75rem] border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-founder-200 hover:shadow-xl hover:shadow-founder-950/5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-founder-600 text-white">
              <CommunityCategoryIcon category={group.category} />
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-founder-600">{group.category}</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-slate-950">{group.name}</h2>
            <div className="mt-3 min-h-[4.5rem] flex-1">
              {group.description ? (
                <p className="line-clamp-3 text-sm leading-6 text-slate-600">{group.description}</p>
              ) : (
                <span className="block min-h-[4.5rem]" aria-hidden />
              )}
            </div>

            <div className="mt-auto space-y-5 pt-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
              <Users className="h-4 w-4 text-founder-600" />
              {(group.member_count ?? 0).toLocaleString("de-DE")} Mitglieder
            </div>

            <div>
              {group.is_member ? (
                <Link
                  href={`/community/${group.id}`}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-founder-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-founder-700"
                >
                  Öffnen
                </Link>
              ) : group.needs_pro ? (
                <Link
                  href="/dashboard"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-founder-200 bg-white px-5 py-3 text-sm font-bold text-founder-700 transition hover:bg-founder-50"
                >
                  <Lock className="h-4 w-4" />
                  Founder Pro nötig
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={joiningId === group.id || !group.can_join}
                  onClick={() => handleJoin(group.id)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-founder-200 bg-white px-5 py-3 text-sm font-bold text-founder-700 transition hover:bg-founder-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {joiningId === group.id ? (
                    "Beitreten..."
                  ) : !group.can_join ? (
                    <>
                      <Lock className="h-4 w-4" />
                      Limit erreicht
                    </>
                  ) : (
                    "Beitreten"
                  )}
                </button>
              )}
            </div>
            </div>
          </article>
        ))}
      </div>

      {filteredCommunities.length === 0 && (
        <p className="rounded-[1.5rem] border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600">
          {query.trim() ? "Keine Communities zu deiner Suche gefunden." : "Noch keine Communities verfügbar."}
        </p>
      )}
    </div>
  );
}
