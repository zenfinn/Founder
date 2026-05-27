import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
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
      <main className="min-h-screen bg-slate-50">
        <AppHeader active="/community" />
        <section className="px-4 py-12">
          <p className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-600">
            Profil nicht gefunden.
          </p>
        </section>
      </main>
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
    <main className="min-h-screen bg-slate-50">
      <AppHeader active="/community" />
      <section className="px-4 py-10">
        <MemberProfileView profile={profile} viewerId={session.user.id} pendingRequest={pendingRequest} />
      </section>
    </main>
  );
}
