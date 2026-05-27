import { AppHeader } from "@/components/AppHeader";
import { AdminExternalGroupsManager } from "@/components/AdminExternalGroupsManager";

export const metadata = {
  title: "Externe Gruppen verwalten",
  description: "Founder Admin Bereich für externe Gruppen und Bewertungen.",
};

export default function AdminGruppenPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader active="/admin" />
      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-600">Admin</p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Externe Gruppen verwalten.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Genehmige vorgeschlagene Discord-, Telegram- und WhatsApp-Gruppen, entferne veraltete Einträge und moderiere
            Bewertungen.
          </p>
          <AdminExternalGroupsManager />
        </div>
      </section>
    </main>
  );
}
