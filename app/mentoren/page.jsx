import { AppHeader } from "@/components/AppHeader";
import { MentorOfferForm } from "@/components/MentorOfferForm";
import { MentorsList } from "@/components/MentorsList";
import { PageHero } from "@/components/PageHero";

export const metadata = {
  title: "Mentoren",
  description: "Buche geprüfte Unternehmer als Mentoren nach Branche, Expertise und Preis.",
};

export default function MentorenPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader active="/mentoren" />
      <PageHero
        eyebrow="Mentoren"
        title="Lerne direkt von erfolgreichen Unternehmern."
        description="Filtere nach Branche und finde Mentoren, die bereits dort sind, wo du hinwillst. Jede Buchung ist auf konkrete Umsetzung, Wachstum und operative Erfahrung ausgelegt."
        imageUrl="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1600&q=80"
      />
      <section className="px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Filtere nach Branche und Preis. Buchungen laufen über Stripe, Founder verbucht automatisch 15% Provision.
          </p>
          <MentorsList />
          <MentorOfferForm />
        </div>
      </section>
    </main>
  );
}
