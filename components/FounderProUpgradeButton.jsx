"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { readStoredReferralCode } from "@/components/ReferralCapture";

const founderProStripePriceOrProductId =
  process.env.NEXT_PUBLIC_FOUNDER_PRO_STRIPE_PRICE_OR_PRODUCT_ID ?? "price_1TZXveIFneIajosQok3B8fgO";

export function FounderProUpgradeButton() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    setLoading(true);
    setError("");

    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      router.push("/login");
      return;
    }

    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "founder_pro",
        stripe_price_or_product_id: founderProStripePriceOrProductId,
        referral_code: readStoredReferralCode(),
        cancel_path: "/#pro",
      }),
    });

    const payload = await response.json();

    if (!response.ok || !payload.url) {
      setLoading(false);
      setError(payload.error ?? "Checkout konnte nicht gestartet werden.");
      return;
    }

    window.location.href = payload.url;
  }

  return (
    <div>
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        className="mt-8 inline-flex rounded-2xl bg-white px-6 py-4 text-base font-bold text-founder-600 transition hover:bg-founder-50 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Checkout startet..." : "Jetzt upgraden"}
      </button>
      {error && <p className="mt-3 text-sm font-semibold text-founder-50">{error}</p>}
    </div>
  );
}
