import { AppHeader } from "@/components/AppHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EventSubmissionForm } from "@/components/EventSubmissionForm";
import { EventsList } from "@/components/EventsList";
import { PageHero } from "@/components/PageHero";
import { SEO } from "@/components/SEO";
import { sampleEvents } from "@/lib/founder-data";
import { buildEventListSchema, getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata("events");

export default function EventsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <SEO jsonLd={buildEventListSchema(sampleEvents.slice(0, 3))} />
      <AppHeader active="/events" />
      <PageHero
        eyebrow="Events"
        title="Events & Networking für Unternehmer in Deutschland"
        description="Finde Networking-Dinner, taktische Workshops und Konferenzen für verifizierte Gründer. Der Kalender startet in Kürze — reiche schon jetzt dein Event ein."
        imageUrl="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&q=80"
        imageAlt="Networking Events Unternehmer Deutschland"
      />
      <section className="px-4 py-12">
        <div className="mx-auto max-w-6xl space-y-10">
          <Breadcrumbs items={[{ name: "Events", href: "/events" }]} />
          <EventsList />
          <EventSubmissionForm />
        </div>
      </section>
    </main>
  );
}
