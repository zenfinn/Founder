import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { LandingShell } from "@/components/landing/LandingShell";
import { ReferralCapture } from "@/components/ReferralCapture";
import { RegisterProIntent } from "@/components/RegisterProIntent";

function AuthCard({ title, subtitle, highlight, children }) {
  const isActive = highlight;

  return (
    <section
      className={[
        "relative flex max-h-[calc(100dvh-12rem)] flex-col overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-500",
        isActive
          ? "border-[#1a3aad]/70 bg-[#0f0f0f]/88 shadow-[0_0_80px_rgba(26,58,173,0.35)]"
          : "border-[#1a3aad]/25 bg-[#0f0f0f]/70 shadow-[0_0_40px_rgba(26,58,173,0.08)]",
      ].join(" ")}
    >
      {isActive && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-b from-[#1a3aad]/20 via-transparent to-transparent"
        />
      )}
      <div className="relative shrink-0 border-b border-[#1a3aad]/20 px-6 py-5 md:px-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#5b8cff]">{title}</p>
        <h2 className="mt-2 font-serif text-2xl font-bold tracking-tight text-white md:text-3xl">{subtitle}</h2>
      </div>
      <div className="relative overflow-y-auto px-6 py-6 md:px-8">{children}</div>
    </section>
  );
}

export function AuthLanding({ highlight = "login", requestedRank = "aspiring", referralCode = "", intent = "" }) {
  return (
    <LandingShell globeScale={0.58} globeCenterY={0.46} globeGlow={2.4}>
      <ReferralCapture referralCode={referralCode} />

      <main className="relative mx-auto flex min-h-dvh max-w-6xl flex-col px-4 pb-10 pt-8 md:px-6 md:pb-12 md:pt-10">
        <div className="mb-8 flex flex-col items-center text-center md:mb-10">
          <Link href="/" className="group inline-flex flex-col items-center gap-4">
            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-6 rounded-full bg-[#1a3aad]/25 blur-3xl transition group-hover:bg-[#1a3aad]/35"
              />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[#1a3aad]/50 bg-gradient-to-br from-[#1a3aad] to-[#0f2878] font-serif text-4xl font-bold text-white shadow-[0_0_60px_rgba(26,58,173,0.5)] md:h-24 md:w-24 md:text-5xl">
                F
              </div>
            </div>
            <div>
              <p className="font-serif text-3xl font-bold tracking-tight text-white md:text-4xl">Founder</p>
              <p className="mt-1 text-sm text-neutral-500">Verifizierte Gründer-Community</p>
            </div>
          </Link>
        </div>

        <div className="grid flex-1 gap-5 lg:grid-cols-2 lg:gap-6">
          <AuthCard title="Login" subtitle="Willkommen zurück." highlight={highlight === "login"}>
            <p className="mb-5 text-sm leading-6 text-neutral-400">
              Logge dich ein und öffne Dashboard, Rangstatus und Community.
            </p>
            <AuthForm mode="login" compact />
          </AuthCard>

          <AuthCard title="Registrieren" subtitle="Account erstellen." highlight={highlight === "register"}>
            <RegisterProIntent intent={intent} />
            <p className="mb-5 text-sm leading-6 text-neutral-400">
              Starte mit deinem Founder-Profil — danach folgen Verifikation und Rang.
            </p>
            <AuthForm mode="register" requestedRank={requestedRank} compact />
          </AuthCard>
        </div>
      </main>
    </LandingShell>
  );
}
