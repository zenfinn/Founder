import { AppHeader } from "@/components/AppHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { MentorOfferForm } from "@/components/MentorOfferForm";
import { MentorsList } from "@/components/MentorsList";
import { PageHero } from "@/components/PageHero";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata("mentoren");

export default function MentorenPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader active="/mentoren" />
      <PageHero
        eyebrow="Mentoren"
        title="Mentor finden – verifizierte Unternehmer als Coaches"
        description="Buche Builder, Scaler und Elite als 1:1 Mentoren. Transparente Stundensätze und sichere Buchung über Stripe im Unternehmer Netzwerk Founder."
        imageUrl="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1600&q=80"
        imageAlt="Mentoren für Unternehmer Founder Community"
      />
      <section className="px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <Breadcrumbs items={[{ name: "Mentoren", href: "/mentoren" }]} />
          <MentorsList />
          <div id="apply">
            <MentorOfferForm />
          </div>
        </div>
      </section>
    </main>
  );
}
