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
        description="Die Mentor-Liste wächst gerade. Bewirb dich als Mentor oder buche Sessions von verifizierten Unternehmern."
        imageUrl="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1600&q=80"
      />
      <section className="px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <MentorsList />
          <div id="apply">
            <MentorOfferForm />
          </div>
        </div>
      </section>
    </main>
  );
}
