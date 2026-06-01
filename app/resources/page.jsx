import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { GlobalResourcesOverview } from "@/components/resources/GlobalResourcesOverview";
import { PageHero } from "@/components/PageHero";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Ressourcen | Founder",
  description: "Premium-Tools, Lieferanten und Netzwerke aus allen Founder Communities.",
};

export default async function ResourcesPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader active="/resources" />
      <PageHero
        eyebrow="Ressourcen"
        title="Premium-Ressourcen"
        description="Alle kuratierten Tools, Supplier und Netzwerke aus den Founder Communities – filterbar und für Pro-Mitglieder freigeschaltet."
        imageUrl="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&q=80"
      />
      <section className="px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <GlobalResourcesOverview />
        </div>
      </section>
    </main>
  );
}
