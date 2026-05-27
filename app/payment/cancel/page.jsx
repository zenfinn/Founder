import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { ArrowLeft, RotateCcw } from "lucide-react";

export const metadata = {
  title: "Zahlung abgebrochen",
  description: "Der Stripe Checkout wurde abgebrochen.",
};

export default function PaymentCancelPage({ searchParams }) {
  const returnTo = searchParams?.return_to ?? "/";

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader active="/dashboard" />
      <section className="px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center">
          <h1 className="font-serif text-4xl font-bold text-slate-950">Zahlung abgebrochen.</h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Kein Problem. Es wurde nichts berechnet und du kannst Founder Pro jederzeit erneut starten.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={returnTo} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-founder-600 px-6 py-4 text-sm font-bold text-white">
              <ArrowLeft className="h-4 w-4" />
              Zurück
            </Link>
            <Link href="/community" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-6 py-4 text-sm font-bold text-slate-700">
              <RotateCcw className="h-4 w-4" />
              Zur Community
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
