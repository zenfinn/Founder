import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { VerificationForm } from "@/components/VerificationForm";
import { ranks } from "@/lib/founder-data";

const documentsByRank = {
  starter: ["Gewerbeanmeldung"],
  builder: ["Gewerbeanmeldung", "Letzte BWA oder Steuerbescheid"],
  scaler: ["Handelsregisterauszug", "BWA"],
  elite: ["Handelsregisterauszug", "Letzter Jahresabschluss"],
};

export default function VerifyPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/dashboard">
            <BrandMark />
          </Link>
          <Link href="/dashboard" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">
            Dashboard
          </Link>
        </div>
      </header>
      <section className="px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-600">Verifikation</p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-slate-950">Rang bestaetigen lassen.</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Lade die benoetigten Dokumente hoch. Admins pruefen die Einreichung manuell und weisen danach deinen
            verifizierten Rang zu.
          </p>

          <VerificationForm />

          <div className="mt-8 space-y-4">
            {ranks
              .filter((rank) => rank.id !== "aspiring")
              .map((rank) => (
                <article key={rank.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                  <div className={`h-2 w-14 rounded-full ${rank.accent}`} />
                  <h2 className="mt-4 font-serif text-2xl font-bold text-slate-950">{rank.label}</h2>
                  <p className="mt-2 text-sm text-slate-600">{rank.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {documentsByRank[rank.id].map((document) => (
                      <span key={document} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                        {document}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
          </div>
        </div>
      </section>
    </main>
  );
}
