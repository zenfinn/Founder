import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { PageHero } from "@/components/PageHero";
import { RankTierCard } from "@/components/ranks/RankTierCard";
import { rankTiers } from "@/lib/rank-system";

export const metadata = {
  title: "Ränge",
  description: "Fünf klare Ränge – ein Dokument pro Stufe, ehrliche Vorteile, kein Papierkram.",
};

export default function RaengePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader active="/raenge" />
      <PageHero
        eyebrow="Ränge"
        title="Wachse mit deinem Unternehmen – Schritt für Schritt."
        description="Registrieren reicht für den Start. Jeder höhere Rang braucht genau ein Nachweis-Dokument. Kein Formular-Marathon."
        imageUrl="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1600&q=80"
      >
        <Link href="/register?rank=aspiring" className="inline-flex rounded-2xl bg-founder-600 px-6 py-4 text-sm font-bold text-white">
          Kostenlos starten
        </Link>
      </PageHero>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-6xl space-y-5">
          {rankTiers.map((tier) => (
            <RankTierCard key={tier.id} tier={tier} />
          ))}
        </div>
      </section>
    </main>
  );
}
