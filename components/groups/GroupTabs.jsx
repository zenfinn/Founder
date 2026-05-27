"use client";

import { useEffect, useState } from "react";
import { GroupChat } from "@/components/groups/GroupChat";
import { ResourceRanking } from "@/components/groups/ResourceRanking";
import { CommunityWins } from "@/components/groups/CommunityWins";
import { GroupSubgroups } from "@/components/groups/GroupSubgroups";
import { SubgroupDirectory } from "@/components/groups/SubgroupDirectory";
import { BarChart3, Layers3, MessageCircle, Trophy, Users } from "lucide-react";

const tabs = [
  { id: "chat", label: "Chat", Icon: MessageCircle },
  { id: "ranking", label: "Rankings", Icon: BarChart3 },
  { id: "wins", label: "Wins", Icon: Trophy },
  { id: "subgroups", label: "Untergruppen", Icon: Layers3 },
];

export function GroupTabs({ group, initialTab = "chat" }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  const groupId = group?.id;

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
            {tabs.map(({ id, label, Icon }) => (
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
              </button>
            ))}
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
        {groupId && activeTab === "ranking" && <ResourceRanking groupId={groupId} />}
        {groupId && activeTab === "wins" && <CommunityWins groupId={groupId} />}
        {groupId && activeTab === "subgroups" && <GroupSubgroups groupId={groupId} />}
      </div>
    </div>
  );
}
