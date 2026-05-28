import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { BrandMark } from "@/components/BrandMark";
import { ReferralCapture } from "@/components/ReferralCapture";
import { RegisterProIntent } from "@/components/RegisterProIntent";

export default function RegisterPage({ searchParams }) {
  const requestedRank = searchParams?.rank ?? searchParams?.rang ?? "aspiring";
  const referralCode = searchParams?.ref ?? "";
  const intent = searchParams?.intent ?? "";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <ReferralCapture referralCode={referralCode} />
      <RegisterProIntent intent={intent} />
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-2xl flex-col justify-center">
        <Link href="/" className="mb-8 inline-flex">
          <BrandMark />
        </Link>
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-founder-600">Founder Beta</p>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-950">Starte mit deinem Founder Profil.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Erstelle deinen Account. Danach folgen Profil, Rang-Auswahl und Verifikation.
          </p>
          <div className="mt-6">
            <AuthForm mode="register" requestedRank={requestedRank} />
          </div>
          <p className="mt-6 text-center text-sm text-slate-600">
            Bereits registriert?{" "}
            <Link href="/login" className="font-bold text-founder-600">
              Einloggen
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
