"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { GroupTabs } from "@/components/groups/GroupTabs";
import { RelatedCommunities } from "@/components/groups/RelatedCommunities";
import { CockpitPage, CockpitPanel } from "@/components/cockpit/CockpitPage";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getGroupById, joinGroup } from "@/lib/groups";
import { getOwnProfile } from "@/lib/profiles";
import { ArrowLeft } from "lucide-react";

function GroupDetailContent({ groupId }) {
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab") ?? "chat";
  const initialTab = rawTab === "ranking" ? "resources" : rawTab;
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [group, setGroup] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGroup() {
      try {
        if (!groupId) {
          setError("Keine Gruppen-ID übergeben.");
          return;
        }

        const groupData = await getGroupById(supabase, groupId);
        if (!groupData) {
          setError("Gruppe nicht gefunden.");
          return;
        }
        setGroup(groupData);

        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;
        if (user) {
          const profile = await getOwnProfile(supabase, user.id);
          try {
            await joinGroup(supabase, { groupId, userId: user.id, profile });
          } catch {
            // Limit erreicht oder bereits Mitglied – Gruppe trotzdem anzeigen
          }
        }
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    loadGroup();
  }, [groupId, supabase]);

  return (
    <>
      {loading && (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-600">
          Gruppe wird geladen...
        </div>
      )}

      {error && (
        <div className="rounded-[2rem] border border-red-100 bg-red-50 p-8 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {group && (
        <>
          <GroupTabs group={group} initialTab={initialTab} />
          <RelatedCommunities currentSlug={group.slug} />
        </>
      )}
    </>
  );
}

export function GroupDetail({ groupId }) {
  return (
    <CockpitPage>
      <Link href="/community" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#5b8cff]">
        <ArrowLeft className="h-4 w-4" />
        Zurück zur Community
      </Link>

      <CockpitPanel className="!p-0 md:!p-0">
        <div className="p-5 md:p-6">
          <Suspense
            fallback={
              <div className="text-sm font-semibold text-neutral-400">Gruppe wird geladen...</div>
            }
          >
            <GroupDetailContent groupId={groupId} />
          </Suspense>
        </div>
      </CockpitPanel>
    </CockpitPage>
  );
}
