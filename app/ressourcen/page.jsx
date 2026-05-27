import { AppHeader } from "@/components/AppHeader";
import { PartnerResources } from "@/components/PartnerResources";

export default function RessourcenPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader active="/ressourcen" />
      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-600">Ressourcen</p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Partner, Tools und Founder Deals.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Kuratierte Partner für Reselling, Dropshipping, TikTok und E-Commerce. Admins können Partner im
            Admin-Bereich verwalten.
          </p>
          <PartnerResources />
        </div>
      </section>
    </main>
  );
}
