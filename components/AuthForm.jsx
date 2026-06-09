"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { sanitizeProfilePayload } from "@/lib/profiles";
import { readStoredReferralCode } from "@/components/ReferralCapture";
import { FOUNDER_PRO_INTENT_KEY } from "@/components/RegisterProIntent";

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

export function AuthForm({ mode = "login", requestedRank = "aspiring", compact = false }) {
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

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;

    const { data, error } = isRegister
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${appUrl}/login`,
            data: {
              display_name: name,
              company_name: companyName,
              industry,
              estimated_annual_revenue: estimatedAnnualRevenue,
              requested_rank: requestedRank,
            },
          },
        })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (isRegister && data.user) {
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          ...sanitizeProfilePayload({
            display_name: name,
            company_name: companyName,
            industry,
            username: "",
            bio: "",
            avatar_url: "",
            instagram_url: "",
            tiktok_url: "",
            linkedin_url: "",
            website_url: "",
            twitter_url: "",
          }),
          estimated_annual_revenue: estimatedAnnualRevenue,
          requested_rank: requestedRank,
          current_rank: "aspiring",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

      if (profileError) {
        setMessage(profileError.message);
        setLoading(false);
        return;
      }

      await fetch("/api/auth/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      const referralCode = readStoredReferralCode();
      if (referralCode) {
        await fetch("/api/referrals/attach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ referralCode }),
        });
      }
    }

    const proIntent =
      typeof window !== "undefined" && window.sessionStorage.getItem(FOUNDER_PRO_INTENT_KEY) === "1";

    router.push(isRegister ? (proIntent ? "/dashboard" : "/profile/verify") : "/dashboard");
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

    setMessage(error ? error.message : "Wenn ein Account existiert, wurde eine Passwort-E-Mail versendet.");
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
              placeholder="z.B. 50.000 EUR"
              value={estimatedAnnualRevenue}
              onChange={(event) => setEstimatedAnnualRevenue(event.target.value)}
              required
            />
          </label>
          <div className="rounded-xl bg-founder-50 px-3 py-2 text-xs font-semibold text-founder-800">
            Gewünschter Rang: {requestedRank}
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
