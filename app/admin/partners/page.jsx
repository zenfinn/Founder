import Link from "next/link";
import { AdminPartnersManager } from "@/components/AdminPartnersManager";
import { BrandMark } from "@/components/BrandMark";

export default function AdminPartnersPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/admin">
            <BrandMark />
          </Link>
          <Link href="/ressourcen" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">
            Ressourcen
          </Link>
        </div>
      </header>
      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-600">Admin</p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-slate-950">Partner verwalten.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Partner-Ressourcen anlegen und aktivieren. Zugriff wird über die Supabase Admin-RLS geprüft.
          </p>
          <AdminPartnersManager />
        </div>
      </section>
    </main>
  );
}
