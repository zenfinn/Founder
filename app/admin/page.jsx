import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { AuthGuard } from "@/components/AuthGuard";
import { AdminMetrics } from "@/components/AdminMetrics";
import { Calendar, HandCoins, ShieldCheck, Users } from "lucide-react";

const adminLinks = [
  { href: "/admin/verifications", label: "Verifikationen", description: "Dokumente prüfen, Ränge bestätigen oder ablehnen.", Icon: ShieldCheck },
  { href: "/admin/gruppen", label: "Externe Gruppen", description: "Vorschläge prüfen, Gruppen bearbeiten und Bewertungen moderieren.", Icon: Users },
  { href: "/admin/events", label: "Events", description: "Events erstellen, bearbeiten und Tickets verwalten.", Icon: Calendar },
  { href: "/admin/mentoren", label: "Mentoren", description: "Mentoren freischalten und Provisionen einsehen.", Icon: HandCoins },
  { href: "/admin/members", label: "Members", description: "Mitglieder verwalten, Ränge ändern und Accounts sperren.", Icon: Users },
];

export const metadata = {
  title: "Admin",
  description: "Founder Admin Dashboard.",
};

export default function AdminPage() {
  return (
    <AuthGuard adminOnly>
      <main className="min-h-screen bg-slate-50">
      <AppHeader active="/admin" />
      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-600">Admin</p>
          <h1 className="mt-3 font-serif text-5xl font-bold tracking-tight text-slate-950">Founder Kontrollzentrum.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Übersicht für Verifikationen, Mitglieder, Events, Mentoren, Ressourcen und Umsatz-Kennzahlen.
          </p>

          <AdminMetrics />

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {adminLinks.map(({ href, label, description, Icon }) => (
              <Link key={href} href={href} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 transition hover:-translate-y-1">
                <Icon className="h-8 w-8 text-founder-600" />
                <h2 className="mt-4 font-serif text-3xl font-bold text-slate-950">{label}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      </main>
    </AuthGuard>
  );
}
