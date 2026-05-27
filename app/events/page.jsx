import { AppHeader } from "@/components/AppHeader";
import { EventSubmissionForm } from "@/components/EventSubmissionForm";
import { EventsList } from "@/components/EventsList";
import { PageHero } from "@/components/PageHero";

export const metadata = {
  title: "Events",
  description: "Founder Events, Workshops, Dinners und Konferenzen für verifizierte Unternehmer.",
};

export default function EventsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader active="/events" />
      <PageHero
        eyebrow="Events"
        title="Workshops, Dinners und Founder Calls."
        description="Finde Networking-Dinner, taktische Workshops und Konferenzen für deine Branche. Der Kalender startet in Kürze — reiche schon jetzt dein Event ein."
        imageUrl="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&q=80"
      />
      <section className="px-4 py-12">
        <div className="mx-auto max-w-6xl space-y-10">
          <EventsList />
          <EventSubmissionForm />
        </div>
      </section>
    </main>
  );
}
