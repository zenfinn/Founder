"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { sanitizeProfilePayload } from "@/lib/profiles";
import { readStoredReferralCode } from "@/components/ReferralCapture";

const industries = [
  "Reselling",
  "Dropshipping",
  "E-Commerce",
  "Amazon FBA",
  "TikTok Creator",
  "TikTok Shop",
  "KI Creator",
  "Trading",
  "Memecoin Trading",
  "YouTube Automation",
  "Digital Business",
];

export function AuthForm({ mode = "login", requestedRank = "aspiring" }) {
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

    const { data, error } = isRegister
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
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

    router.push(isRegister ? "/profile/verify" : "/dashboard");
    router.refresh();
  }

  async function handlePasswordReset() {
    if (!email) {
      setMessage("Bitte gib zuerst deine E-Mail-Adresse ein.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    setMessage(error ? error.message : "Wenn ein Account existiert, wurde eine Passwort-E-Mail versendet.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isRegister && (
        <>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Name</span>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none transition focus:border-founder-600 focus:ring-4 focus:ring-founder-100"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
        </>
      )}
      <label className="block">
        <span className="text-sm font-semibold text-slate-700">E-Mail</span>
        <input
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none transition focus:border-founder-600 focus:ring-4 focus:ring-founder-100"
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
            <span className="text-sm font-semibold text-slate-700">Unternehmensname</span>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none transition focus:border-founder-600 focus:ring-4 focus:ring-founder-100"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Branche</span>
            <select
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none transition focus:border-founder-600 focus:ring-4 focus:ring-founder-100"
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
            <span className="text-sm font-semibold text-slate-700">Geschätzter Jahresumsatz</span>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none transition focus:border-founder-600 focus:ring-4 focus:ring-founder-100"
              placeholder="z.B. 50.000 EUR"
              value={estimatedAnnualRevenue}
              onChange={(event) => setEstimatedAnnualRevenue(event.target.value)}
              required
            />
          </label>
          <div className="rounded-2xl bg-founder-50 px-4 py-3 text-sm font-semibold text-founder-800">
            Gewünschter Rang: {requestedRank}
          </div>
        </>
      )}
      <label className="block">
        <span className="text-sm font-semibold text-slate-700">Passwort</span>
        <input
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none transition focus:border-founder-600 focus:ring-4 focus:ring-founder-100"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      {!isRegister && (
        <button onClick={handlePasswordReset} className="text-sm font-bold text-founder-600" type="button">
          Passwort vergessen?
        </button>
      )}
      {message && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{message}</p>}
      <button
        className="w-full rounded-2xl bg-founder-600 px-5 py-3 text-base font-bold text-white transition hover:bg-founder-700 disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={loading}
      >
        {loading ? "Bitte warten..." : isRegister ? "Account erstellen" : "Einloggen"}
      </button>
    </form>
  );
}
