import { AppHeader } from "@/components/AppHeader";
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
        description="Finde Networking-Dinner, taktische Workshops und Konferenzen für deine Branche. Filtere nach Kategorie und Datum, sichere dir Tickets oder melde dich kostenlos an."
        imageUrl="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&q=80"
      />
      <section className="px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Kostenlose und bezahlte Events werden nach Rang-Zugang ausgespielt. Bezahlte Tickets laufen über Stripe,
            danach erhältst du automatisch deine Bestätigung per E-Mail.
          </p>
          <EventsList />
        </div>
      </section>
    </main>
  );
}
