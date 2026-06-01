import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CommunityGroupsGrid } from "@/components/groups/CommunityGroupsGrid";
import { PageHero } from "@/components/PageHero";
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
    <main className="min-h-screen bg-slate-50">
      <AppHeader active="/community" />
      <PageHero
        eyebrow="Community"
        title="Branchen-Communities für Gründer in Deutschland"
        description="Reselling Community, E-Commerce Netzwerk, Amazon FBA, TikTok Creator und mehr – Chat, Ressourcen und Wins für verifizierte Unternehmer."
        imageUrl="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&q=80"
        imageAlt="Gründer Community Networking Deutschland"
      />
      <section className="px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <Breadcrumbs items={[{ name: "Community", href: "/community" }]} />
          <CommunityGroupsGrid initialPayload={initialPayload} />
        </div>
      </section>
    </main>
  );
}
