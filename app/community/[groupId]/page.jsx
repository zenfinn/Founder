import { redirect } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { GroupAccessGate } from "@/components/groups/GroupAccessGate";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Founder Gruppe",
  description: "Native Founder Gruppe mit Echtzeit-Chat, Ressourcen-Ranking und Community Wins.",
};

export default async function CommunityGroupPage({ params }) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const groupId = params?.groupId;

  return (
    <AuthGuard>
      <GroupAccessGate groupId={groupId} />
    </AuthGuard>
  );
}
