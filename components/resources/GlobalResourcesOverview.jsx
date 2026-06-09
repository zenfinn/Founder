"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getOwnProfile } from "@/lib/profiles";
import { isFounderPro } from "@/lib/membership";
import { getResourceTypeLabel, getResourceTypeMeta, resourceTypes } from "@/lib/resource-types";
import { FounderProUpgradeButton } from "@/components/FounderProUpgradeButton";
import { ProResourcesPageOverlay } from "@/components/resources/ProResourcesPageOverlay";

export function GlobalResourcesOverview() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [resources, setResources] = useState([]);
  const [memberGroupIds, setMemberGroupIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [communityFilter, setCommunityFilter] = useState("all");

  const proAccess = isFounderPro(profile);
  const hasGroupAccess = proAccess || memberGroupIds.length > 0;

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id;
        if (!userId) return;
        const nextProfile = await getOwnProfile(supabase, userId);
        if (active) setProfile(nextProfile);
      } finally {
        if (active) setProfileLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (profileLoading) return;

    let active = true;

    async function loadResources() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/resources", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Ressourcen konnten nicht geladen werden.");
        }

        if (active) {
          setResources(payload.resources ?? []);
          setMemberGroupIds(payload.access?.memberGroupIds ?? []);
        }
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadResources();

    return () => {
      active = false;
    };
  }, [profileLoading]);

  const communities = useMemo(() => {
    const names = new Map();
    resources.forEach((resource) => {
      if (resource.group?.name) {
        names.set(resource.group.id, resource.group.name);
      }
    });
    return [...names.entries()].map(([id, name]) => ({ id, name }));
  }, [resources]);

  const filteredResources = resources.filter((resource) => {
    const needle = query.trim().toLowerCase();
    const matchesQuery =
      !needle ||
      resource.title.toLowerCase().includes(needle) ||
      resource.group?.name?.toLowerCase().includes(needle) ||
      resource.group?.category?.toLowerCase().includes(needle);

    const matchesType = typeFilter === "all" || resource.type === typeFilter;
    const matchesCommunity = communityFilter === "all" || resource.group?.id === communityFilter;

    return matchesQuery && matchesType && matchesCommunity;
  });

  return (
    <div className="relative min-h-[640px]">
      {!profileLoading && !hasGroupAccess && <ProResourcesPageOverlay cancelPath="/resources" variant="join" />}

      {hasGroupAccess && (
        <>
          {!proAccess && (
            <div className="mb-4 rounded-xl border border-[#1a3aad]/30 bg-[#0f0f0f] p-4">
              <p className="text-sm font-semibold text-white">Ressourcen deiner Community</p>
              <p className="mt-1 text-xs leading-5 text-neutral-400">
                Im Free-Plan siehst du Tools und Lieferanten deiner beigetretenen Gruppe. Mit Founder Pro
                schaltest du alle Communities frei.
              </p>
              <FounderProUpgradeButton
                label="Pro für alle Ressourcen"
                cancelPath="/resources"
                className="mt-3 inline-flex rounded-xl bg-[#1a3aad] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#2f61df]"
                errorClassName="mt-2 text-xs font-semibold text-red-400"
              />
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <input
                className="w-full rounded-xl border border-[#1a3aad]/30 bg-[#0f0f0f] py-3 pl-11 pr-4 text-sm font-semibold text-white outline-none focus:border-[#1a3aad]"
                placeholder="Tools, Communities oder Kategorien suchen..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <select
              className="rounded-xl border border-[#1a3aad]/30 bg-[#0f0f0f] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-[#1a3aad]"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <option value="all">Alle Typen</option>
              {resourceTypes.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              className="rounded-xl border border-[#1a3aad]/30 bg-[#0f0f0f] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-[#1a3aad]"
              value={communityFilter}
              onChange={(event) => setCommunityFilter(event.target.value)}
            >
              <option value="all">Alle Communities</option>
              {communities.map((community) => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
              {error}
            </p>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              <p className="col-span-full rounded-xl border border-[#1a3aad]/30 bg-[#0f0f0f] p-6 text-sm font-semibold text-neutral-400">
                Ressourcen werden geladen...
              </p>
            ) : null}

            {!loading && filteredResources.length === 0 ? (
              <p className="col-span-full rounded-xl border border-[#1a3aad]/30 bg-[#0f0f0f] p-6 text-sm font-semibold text-neutral-400">
                {query.trim() || typeFilter !== "all" || communityFilter !== "all"
                  ? "Keine Ressourcen zu deinen Filtern gefunden."
                  : "Noch keine Ressourcen in deiner Community."}
              </p>
            ) : null}

            {!loading &&
              filteredResources.map((resource) => {
                const typeMeta = getResourceTypeMeta(resource.type);

                return (
                  <article
                    key={resource.id}
                    className="flex h-full flex-col rounded-xl border border-[#1a3aad]/30 bg-[#0f0f0f] p-5 transition hover:border-[#1a3aad]/70"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${typeMeta?.badgeClass ?? "bg-slate-100 text-slate-700"}`}
                      >
                        {getResourceTypeLabel(resource.type)}
                      </span>
                      {resource.group?.name && (
                        <span className="rounded-full border border-[#1a3aad]/25 px-3 py-1 text-xs font-bold text-neutral-400">
                          {resource.group.name}
                        </span>
                      )}
                    </div>
                    <h2 className="mt-4 font-serif text-2xl font-bold text-white">{resource.title}</h2>
                    <p className="mt-2 text-sm font-semibold text-emerald-400">Score {resource.score}</p>
                    <div className="mt-auto space-y-3 pt-5">
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-bold text-[#1a3aad]"
                      >
                        Öffnen <ExternalLink className="h-4 w-4" />
                      </a>
                      {resource.group?.id && (
                        <Link
                          href={`/community/${resource.group.id}?tab=resources`}
                          className="block text-xs font-bold uppercase tracking-[0.16em] text-neutral-500 transition hover:text-[#1a3aad]"
                        >
                          In Community ansehen
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
