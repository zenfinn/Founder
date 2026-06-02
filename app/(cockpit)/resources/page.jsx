import { redirect } from "next/navigation";
import { CockpitPage, CockpitPanel } from "@/components/cockpit/CockpitPage";
import { GlobalResourcesOverview } from "@/components/resources/GlobalResourcesOverview";
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
    <CockpitPage
      eyebrow="Ressourcen"
      title="Premium-Ressourcen"
      description="Kuratierte Tools, Supplier und Netzwerke aus den Founder Communities — filterbar und für Pro-Mitglieder freigeschaltet."
    >
      <CockpitPanel>
        <GlobalResourcesOverview />
      </CockpitPanel>
    </CockpitPage>
  );
}
