import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { BrandMark } from "@/components/BrandMark";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-center">
        <Link href="/" className="mb-8 inline-flex">
          <BrandMark />
        </Link>
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-founder-600">Login</p>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-950">Willkommen zurück.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Logge dich ein, um dein Dashboard, deinen Rangstatus und Founder zu öffnen.
          </p>
          <div className="mt-6">
            <AuthForm mode="login" />
          </div>
          <p className="mt-6 text-center text-sm text-slate-600">
            Noch kein Account?{" "}
            <Link href="/register" className="font-bold text-founder-600">
              Jetzt registrieren
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
