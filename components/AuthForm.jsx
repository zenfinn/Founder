"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { readStoredReferralCode } from "@/components/ReferralCapture";
import { shouldShowFounderOnboarding } from "@/lib/founder-ai-onboarding";
import {
  formatAnnualRevenueEur,
  getRankTier,
  parseAnnualRevenueInput,
  resolveRequestedRank,
} from "@/lib/rank-system";

const industries = [
  "Reselling",
  "Dropshipping",
  "E-Commerce",
  "Real Estate",
  "TikTok Creator",
  "TikTok Shop",
  "KI Creator",
  "Trading",
  "Memecoin Trading",
  "YouTube Automation",
  "Traditional Services",
  "Web Design",
];

function mapAuthError(message = "") {
  const text = message.toLowerCase();

  if (text.includes("rate limit")) {
    return "Zu viele Versuche. Bitte warte ein paar Minuten und versuche es erneut.";
  }

  if (text.includes("invalid login")) {
    return "Login fehlgeschlagen. Prüfe E-Mail und Passwort.";
  }

  return message || "Anmeldung fehlgeschlagen.";
}

export function AuthForm({ mode = "login", requestedRank: defaultRank = "aspiring", compact = false }) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState(industries[0]);
  const [estimatedAnnualRevenue, setEstimatedAnnualRevenue] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const isRegister = mode === "register";
  const parsedRevenue = useMemo(() => parseAnnualRevenueInput(estimatedAnnualRevenue), [estimatedAnnualRevenue]);
  const requestedRank = useMemo(
    () => resolveRequestedRank({ revenueInput: estimatedAnnualRevenue, fallbackRank: defaultRank }),
    [estimatedAnnualRevenue, defaultRank]
  );
  const rankTier = useMemo(() => getRankTier(requestedRank), [requestedRank]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (isRegister) {
      const referralCode = readStoredReferralCode();
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          company_name: companyName,
          industry,
          estimated_annual_revenue: estimatedAnnualRevenue,
          requested_rank: requestedRank,
          referral_code: referralCode,
        }),
      });

      const registerPayload = await registerResponse.json().catch(() => ({}));
      if (!registerResponse.ok) {
        setMessage(registerPayload.error ?? "Registrierung fehlgeschlagen.");
        setLoading(false);
        return;
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(mapAuthError(error.message));
      setLoading(false);
      return;
    }

    const userId = data.user?.id ?? data.session?.user?.id;
    const nextPath = userId && shouldShowFounderOnboarding(userId) ? "/onboarding/founder" : "/dashboard";

    router.push(nextPath);
    router.refresh();
  }

  async function handlePasswordReset() {
    if (!email) {
      setMessage("Bitte gib zuerst deine E-Mail-Adresse ein.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/login`,
    });

    setMessage(error ? mapAuthError(error.message) : "Wenn ein Account existiert, wurde eine Passwort-E-Mail versendet.");
  }

  const fieldClass =
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-founder-600 focus:ring-4 focus:ring-founder-100";
  const labelClass = compact ? "text-xs font-semibold text-slate-700" : "text-sm font-semibold text-slate-700";

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-3" : "space-y-4"}>
      {isRegister && (
        <>
          <label className="block">
            <span className={labelClass}>Name</span>
            <input
              className={fieldClass}
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
        </>
      )}
      <label className="block">
        <span className={labelClass}>E-Mail</span>
        <input
          className={fieldClass}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      {isRegister && (
        <>
          <label className="block">
            <span className={labelClass}>Unternehmensname</span>
            <input
              className={fieldClass}
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className={labelClass}>Branche</span>
            <select
              className={fieldClass}
              value={industry}
              onChange={(event) => setIndustry(event.target.value)}
              required
            >
              {industries.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Geschätzter Jahresumsatz</span>
            <input
              className={fieldClass}
              placeholder="z.B. 1.000.000 EUR"
              value={estimatedAnnualRevenue}
              onChange={(event) => setEstimatedAnnualRevenue(event.target.value)}
              required
            />
          </label>
          <div className="rounded-xl bg-founder-50 px-3 py-2.5 text-xs text-founder-800">
            <p className="font-semibold">Gewünschter Rang: {rankTier.label}</p>
            <p className="mt-1 leading-5 text-founder-700">
              {parsedRevenue !== null
                ? `Automatisch aus deinem Jahresumsatz (${formatAnnualRevenueEur(parsedRevenue)}).`
                : "Wird automatisch aus deinem Jahresumsatz berechnet."}
            </p>
            <p className="mt-1 text-[11px] leading-5 text-founder-600">{rankTier.criteria}</p>
          </div>
        </>
      )}
      <label className="block">
        <span className={labelClass}>Passwort</span>
        <input
          className={fieldClass}
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      {!isRegister && (
        <button onClick={handlePasswordReset} className="text-xs font-bold text-founder-600" type="button">
          Passwort vergessen?
        </button>
      )}
      {message && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{message}</p>}
      <button
        className="w-full rounded-xl bg-founder-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-founder-700 disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={loading}
      >
        {loading ? "Bitte warten..." : isRegister ? "Account erstellen" : "Einloggen"}
      </button>
    </form>
  );
}
