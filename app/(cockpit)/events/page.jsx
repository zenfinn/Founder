import { Suspense } from "react";
import { CockpitPage, CockpitPanel } from "@/components/cockpit/CockpitPage";
import { EventSubmissionForm } from "@/components/EventSubmissionForm";
import { EventsList } from "@/components/EventsList";
import { SEO } from "@/components/SEO";
import { sampleEvents } from "@/lib/founder-data";
import { buildEventListSchema, getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata("events");

export default function EventsPage() {
  return (
    <>
      <SEO jsonLd={buildEventListSchema(sampleEvents.slice(0, 3))} />
      <CockpitPage
        eyebrow="Events"
        title="Events & Networking für Unternehmer"
        description="Networking-Dinner, Workshops und Konferenzen für verifizierte Gründer. Reiche dein Event ein."
      >
        <CockpitPanel>
          <EventsList />
        </CockpitPanel>
        <CockpitPanel>
          <Suspense fallback={<p className="text-sm text-neutral-400">Formular wird geladen…</p>}>
            <EventSubmissionForm />
          </Suspense>
        </CockpitPanel>
      </CockpitPage>
    </>
  );
}
