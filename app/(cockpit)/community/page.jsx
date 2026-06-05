import { redirect } from "next/navigation";
import { CockpitPage, CockpitPanel } from "@/components/cockpit/CockpitPage";
import { CommunityGroupsGrid } from "@/components/groups/CommunityGroupsGrid";
import { listCommunitiesForUser } from "@/lib/communities";
import { getPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = getPageMetadata("community");

export default async function CommunityPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  let initialPayload = null;

  try {
    initialPayload = await listCommunitiesForUser(supabase, session.user.id);
  } catch {
    initialPayload = null;
  }

  return (
    <CockpitPage
      eyebrow="Community"
      title="Branchen-Communities für Gründer"
      description="Real Estate, E-Commerce, Web Design, Traditional Services und mehr — Chat, Ressourcen und Wins für verifizierte Unternehmer."
    >
      <CockpitPanel className="!p-0 md:!p-0">
        <div className="p-5 md:p-6">
          <CommunityGroupsGrid initialPayload={initialPayload} />
        </div>
      </CockpitPanel>
    </CockpitPage>
  );
}
