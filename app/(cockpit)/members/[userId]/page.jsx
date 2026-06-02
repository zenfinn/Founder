import { redirect } from "next/navigation";
import { CockpitPage, CockpitPanel } from "@/components/cockpit/CockpitPage";
import { MemberProfileView } from "@/components/members/MemberProfileView";
import { fetchMemberProfile, fetchPendingMessageRequest } from "@/lib/member-profile";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }) {
  return {
    title: "Mitgliedsprofil",
    description: "Founder Community Profil ansehen und Nachrichtenanfrage senden.",
  };
}

export default async function MemberProfilePage({ params }) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const profile = await fetchMemberProfile(supabase, params.userId);

  if (!profile) {
    return (
      <CockpitPage title="Profil nicht gefunden">
        <CockpitPanel>
          <p className="text-sm font-semibold text-neutral-400">Profil nicht gefunden.</p>
        </CockpitPanel>
      </CockpitPage>
    );
  }

  const pendingRequest =
    session.user.id !== profile.id
      ? await fetchPendingMessageRequest(supabase, {
          senderId: session.user.id,
          recipientId: profile.id,
        })
      : null;

  return (
    <CockpitPage>
      <CockpitPanel>
        <MemberProfileView profile={profile} viewerId={session.user.id} pendingRequest={pendingRequest} />
      </CockpitPanel>
    </CockpitPage>
  );
}
