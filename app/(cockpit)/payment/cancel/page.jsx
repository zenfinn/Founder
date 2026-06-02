import Link from "next/link";
import { CockpitPage, CockpitPanel } from "@/components/cockpit/CockpitPage";
import { ArrowLeft, RotateCcw } from "lucide-react";

export const metadata = {
  title: "Zahlung abgebrochen",
  description: "Der Stripe Checkout wurde abgebrochen.",
};

export default function PaymentCancelPage({ searchParams }) {
  const returnTo = searchParams?.return_to ?? "/";

  return (
    <CockpitPage>
      <CockpitPanel className="mx-auto max-w-2xl text-center">
        <h1 className="font-serif text-4xl font-bold text-white">Zahlung abgebrochen.</h1>
        <p className="mt-4 text-sm leading-6 text-neutral-400">
          Kein Problem. Es wurde nichts berechnet und du kannst Founder Pro jederzeit erneut starten.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={returnTo} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1a3aad] px-6 py-4 text-sm font-bold text-white">
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Link>
          <Link href="/community" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#1a3aad]/40 px-6 py-4 text-sm font-bold text-neutral-200">
            <RotateCcw className="h-4 w-4" />
            Zur Community
          </Link>
        </div>
      </CockpitPanel>
    </CockpitPage>
  );
}
