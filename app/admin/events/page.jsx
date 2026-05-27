import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { AdminEventsManager } from "@/components/AdminEventsManager";
import { BrandMark } from "@/components/BrandMark";

export default function AdminEventsPage() {
  return (
    <AuthGuard adminOnly>
      <main className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white px-4 py-4">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <Link href="/admin"><BrandMark /></Link>
            <Link href="/admin" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">Admin</Link>
          </div>
        </header>
        <section className="px-4 py-8">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-600">Admin Events</p>
            <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-slate-950">Events verwalten.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Live-Daten aus Supabase: Events erstellen, Tickets zählen und Umsatz prüfen.</p>
            <AdminEventsManager />
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}
