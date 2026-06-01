"use client";

import { useEffect, useMemo, useState } from "react";
import { GroupChat } from "@/components/groups/GroupChat";
import { ResourceRanking } from "@/components/groups/ResourceRanking";
import { CommunityWins } from "@/components/groups/CommunityWins";
import { GroupSubgroups } from "@/components/groups/GroupSubgroups";
import { SubgroupDirectory } from "@/components/groups/SubgroupDirectory";
import { GroupVideochat } from "@/components/groups/GroupVideochat";
import { ProResourcesTabOverlay } from "@/components/groups/ProResourcesTabOverlay";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getOwnProfile } from "@/lib/profiles";
import { isFounderPro } from "@/lib/membership";
import { FolderOpen, Layers3, Lock, MessageCircle, Trophy, Users, Video } from "lucide-react";

const tabs = [
  { id: "chat", label: "Chat", Icon: MessageCircle },
  { id: "videochat", label: "Videochat", Icon: Video },
  { id: "resources", label: "Ressourcen", Icon: FolderOpen, requiresPro: true },
  { id: "wins", label: "Wins", Icon: Trophy },
  { id: "subgroups", label: "Untergruppen", Icon: Layers3 },
];

function normalizeTabId(tab) {
  if (tab === "ranking") return "resources";
  return tab;
}

export function GroupTabs({ group, initialTab = "chat" }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [activeTab, setActiveTab] = useState(() => normalizeTabId(initialTab));
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const proAccess = isFounderPro(profile);
  const groupId = group?.id;

  useEffect(() => {
    setActiveTab(normalizeTabId(initialTab));
  }, [initialTab]);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id;
        if (!userId) {
          if (active) setProfile(null);
          return;
        }

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

  return (
    <div className="space-y-6">
      <div className="sticky top-[73px] z-10 rounded-[2rem] border border-slate-200/80 bg-white/90 px-3 py-3 shadow-lg shadow-slate-950/5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 px-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-founder-600">{group?.category ?? "Community"}</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="truncate font-serif text-3xl font-bold tracking-tight text-slate-950">{group?.name ?? "Founder Gruppe"}</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                <Users className="h-3.5 w-3.5 text-founder-600" />
                {(group?.member_count ?? 0).toLocaleString("de-DE")}
              </span>
            </div>
          </div>

          <nav className="flex gap-2 overflow-x-auto rounded-full bg-slate-100/80 p-1">
            {tabs.map(({ id, label, Icon, requiresPro }) => {
              const locked = requiresPro && !profileLoading && !proAccess;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`inline-flex min-w-fit items-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-all duration-200 ${
                    activeTab === id
                      ? "bg-slate-950 text-white shadow-md shadow-slate-950/15"
                      : "text-slate-600 hover:bg-white hover:text-slate-950"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {locked && <Lock className="h-3.5 w-3.5 opacity-80" aria-hidden />}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {groupId && <SubgroupDirectory groupId={groupId} onBrowseAll={() => setActiveTab("subgroups")} />}

      <div className="min-h-[560px]">
        {!groupId && (
          <p className="rounded-[2rem] border border-red-100 bg-red-50 p-6 text-sm font-semibold text-red-700">
            Diese Gruppe konnte nicht geladen werden.
          </p>
        )}
        {groupId && activeTab === "chat" && <GroupChat groupId={groupId} group={group} />}
        {groupId && activeTab === "videochat" && <GroupVideochat groupId={groupId} group={group} />}
        {groupId && activeTab === "resources" && profileLoading && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-600">
            Zugriff wird geprüft...
          </div>
        )}
        {groupId && activeTab === "resources" && !profileLoading && !proAccess && (
          <ProResourcesTabOverlay cancelPath={`/community/${groupId}?tab=resources`} />
        )}
        {groupId && activeTab === "resources" && !profileLoading && proAccess && <ResourceRanking groupId={groupId} />}
        {groupId && activeTab === "wins" && <CommunityWins groupId={groupId} />}
        {groupId && activeTab === "subgroups" && <GroupSubgroups groupId={groupId} />}
      </div>
    </div>
  );
}
