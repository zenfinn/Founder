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
import { canAccessGroupResources, isFounderPro } from "@/lib/membership";
import { Lock, Users } from "lucide-react";

const tabs = [
  { id: "chat", label: "Chat" },
  { id: "videochat", label: "Videochat" },
  { id: "resources", label: "Tools" },
  { id: "wins", label: "Wins" },
  { id: "subgroups", label: "Untergruppen" },
];

function normalizeTabId(tab) {
  if (tab === "ranking" || tab === "tools") return "resources";
  return tab;
}

export function GroupTabs({ group, initialTab = "chat" }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [activeTab, setActiveTab] = useState(() => normalizeTabId(initialTab));
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const proAccess = isFounderPro(profile);
  const isGroupMember = Boolean(group?.is_member);
  const canViewResources = canAccessGroupResources(profile, isGroupMember);
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
    <div className="grid gap-5">
      <header className="grid gap-4 border-b border-[#1a3aad]/20 pb-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-neutral-500">
            {group?.category ?? "Community"}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="truncate font-serif text-3xl font-bold tracking-tight text-white">
              {group?.name ?? "Founder Gruppe"}
            </h1>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500">
              <Users className="h-3.5 w-3.5 text-[#1a3aad]" />
              {(group?.member_count ?? 0).toLocaleString("de-DE")}
            </span>
          </div>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Gruppenbereiche">
          {tabs.map(({ id, label }) => {
            const locked = id === "resources" && !profileLoading && !canViewResources;
            const isActive = activeTab === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`inline-flex items-center gap-1.5 border-b-2 pb-1 text-sm font-semibold tracking-wide transition ${
                  isActive
                    ? "border-[#1a3aad] text-white"
                    : "border-transparent text-neutral-500 hover:text-[#1a3aad]"
                }`}
              >
                {label}
                {locked && <Lock className="h-3 w-3 opacity-70" aria-hidden />}
              </button>
            );
          })}
        </nav>
      </header>

      {groupId && (activeTab === "chat" || activeTab === "videochat") && (
        <SubgroupDirectory groupId={groupId} onBrowseAll={() => setActiveTab("subgroups")} variant="terminal" />
      )}

      <div className="min-h-[560px]">
        {!groupId && (
          <p className="border border-red-500/30 px-4 py-3 text-sm font-semibold text-red-300">
            Diese Gruppe konnte nicht geladen werden.
          </p>
        )}
        {groupId && activeTab === "chat" && <GroupChat groupId={groupId} group={group} />}
        {groupId && activeTab === "videochat" && <GroupVideochat groupId={groupId} group={group} />}
        {groupId && activeTab === "resources" && profileLoading && (
          <p className="text-sm font-semibold text-neutral-500">Zugriff wird geprüft...</p>
        )}
        {groupId && activeTab === "resources" && !profileLoading && !canViewResources && (
          <ProResourcesTabOverlay
            cancelPath={`/community/${groupId}?tab=resources`}
            variant={isGroupMember ? "pro" : "join"}
            groupId={groupId}
          />
        )}
        {groupId && activeTab === "resources" && !profileLoading && canViewResources && (
          <ResourceRanking groupId={groupId} />
        )}
        {groupId && activeTab === "wins" && <CommunityWins groupId={groupId} />}
        {groupId && activeTab === "subgroups" && <GroupSubgroups groupId={groupId} />}
      </div>
    </div>
  );
}
