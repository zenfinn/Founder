import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { CommunityGroupsGrid } from "@/components/groups/CommunityGroupsGrid";
import { PageHero } from "@/components/PageHero";
import { listCommunitiesForUser } from "@/lib/communities";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Community",
  description: "Alle Founder Communities mit Echtzeit-Chat, Ressourcen-Ranking und Community Wins.",
};

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
    <main className="min-h-screen bg-slate-50">
      <AppHeader active="/community" />
      <PageHero
        eyebrow="Community"
        title="Deine Branche. Dein Netzwerk."
        description="Wähle die Community, die zu deinem Geschäftsmodell passt. Chat, Ressourcen und Wins – alles nativ in Founder."
        imageUrl="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&q=80"
      />
      <section className="px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <CommunityGroupsGrid initialPayload={initialPayload} />
        </div>
      </section>
    </main>
  );
}
