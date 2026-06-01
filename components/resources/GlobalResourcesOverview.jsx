"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getOwnProfile } from "@/lib/profiles";
import { isFounderPro } from "@/lib/membership";
import { getResourceTypeLabel, getResourceTypeMeta, resourceTypes } from "@/lib/resource-types";
import { ProResourcesPageOverlay } from "@/components/resources/ProResourcesPageOverlay";

export function GlobalResourcesOverview() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [communityFilter, setCommunityFilter] = useState("all");

  const proAccess = isFounderPro(profile);

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
    if (!proAccess || profileLoading) return;

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

        if (active) setResources(payload.resources ?? []);
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
  }, [proAccess, profileLoading]);

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
      <div className={proAccess ? "" : "pointer-events-none select-none blur-sm"}>
        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-founder-600 focus:ring-4 focus:ring-founder-100"
              placeholder="Tools, Communities oder Kategorien suchen..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              disabled={!proAccess}
            />
          </label>

          <select
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-founder-600"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            disabled={!proAccess}
          >
            <option value="all">Alle Typen</option>
            {resourceTypes.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-founder-600"
            value={communityFilter}
            onChange={(event) => setCommunityFilter(event.target.value)}
            disabled={!proAccess}
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
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {profileLoading || (proAccess && loading) ? (
            <p className="col-span-full rounded-[1.5rem] border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-600">
              Ressourcen werden geladen...
            </p>
          ) : null}

          {!profileLoading && proAccess && !loading && filteredResources.length === 0 ? (
            <p className="col-span-full rounded-[1.5rem] border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-600">
              {query.trim() || typeFilter !== "all" || communityFilter !== "all"
                ? "Keine Ressourcen zu deinen Filtern gefunden."
                : "Noch keine Premium-Ressourcen verfügbar."}
            </p>
          ) : null}

          {proAccess &&
            filteredResources.map((resource) => {
              const typeMeta = getResourceTypeMeta(resource.type);

              return (
                <article
                  key={resource.id}
                  className="flex h-full flex-col rounded-[1.75rem] border border-slate-200 bg-white p-5 transition hover:border-founder-200 hover:shadow-lg hover:shadow-founder-950/5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${typeMeta?.badgeClass ?? "bg-slate-100 text-slate-700"}`}
                    >
                      {getResourceTypeLabel(resource.type)}
                    </span>
                    {resource.group?.name && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {resource.group.name}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-4 font-serif text-2xl font-bold text-slate-950">{resource.title}</h2>
                  <p className="mt-2 text-sm font-semibold text-emerald-700">Score {resource.score}</p>
                  <div className="mt-auto space-y-3 pt-5">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-bold text-founder-600"
                    >
                      Öffnen <ExternalLink className="h-4 w-4" />
                    </a>
                    {resource.group?.id && (
                      <Link
                        href={`/community/${resource.group.id}?tab=resources`}
                        className="block text-xs font-bold uppercase tracking-[0.16em] text-slate-500 transition hover:text-founder-600"
                      >
                        In Community ansehen
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
        </div>
      </div>

      {!profileLoading && !proAccess && <ProResourcesPageOverlay cancelPath="/resources" />}
    </div>
  );
}
