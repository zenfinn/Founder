import { CockpitPage, CockpitPanel } from "@/components/cockpit/CockpitPage";
import { MentorOfferForm } from "@/components/MentorOfferForm";
import { MentorsList } from "@/components/MentorsList";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata("mentoren");

export default function MentorenPage() {
  return (
    <CockpitPage
      eyebrow="Mentoren"
      title="Mentor finden — verifizierte Unternehmer"
      description="Buche Builder, Scaler und Elite als 1:1 Mentoren. Transparente Monatspreise und sichere Buchung über Stripe."
    >
      <CockpitPanel>
        <MentorsList />
      </CockpitPanel>
      <CockpitPanel>
        <div id="apply">
          <MentorOfferForm />
        </div>
      </CockpitPanel>
    </CockpitPage>
  );
}
