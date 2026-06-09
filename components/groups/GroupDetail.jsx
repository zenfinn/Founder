"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { GroupTabs } from "@/components/groups/GroupTabs";
import { RelatedCommunities } from "@/components/groups/RelatedCommunities";
import { CockpitPage } from "@/components/cockpit/CockpitPage";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getGroupById, isUserGroupMember, joinGroup } from "@/lib/groups";
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
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;
        let isMember = false;

        if (user) {
          const profile = await getOwnProfile(supabase, user.id);
          try {
            await joinGroup(supabase, { groupId, userId: user.id, profile });
          } catch {
            // Limit erreicht oder bereits Mitglied – Gruppe trotzdem anzeigen
          }
          isMember = await isUserGroupMember(supabase, groupId, user.id);
        }

        setGroup({ ...groupData, is_member: isMember });
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
      {loading && <p className="text-sm font-semibold text-neutral-500">Gruppe wird geladen…</p>}

      {error && (
        <p className="border border-red-500/30 px-4 py-3 text-sm font-semibold text-red-300">{error}</p>
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

      <Suspense fallback={<div className="text-sm font-semibold text-neutral-400">Gruppe wird geladen…</div>}>
        <GroupDetailContent groupId={groupId} />
      </Suspense>
    </CockpitPage>
  );
}
