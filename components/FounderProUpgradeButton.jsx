"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { trackEvent } from "@/components/Analytics";
import { readStoredReferralCode } from "@/components/ReferralCapture";
import { sanitizeStripeErrorMessage } from "@/lib/stripe-errors";

export const FOUNDER_PRO_PRODUCT_ID = "prod_UYfGh1P7PJkCin";

export function FounderProUpgradeButton({
  label = "Jetzt upgraden",
  className = "mt-8 inline-flex rounded-2xl bg-white px-6 py-4 text-base font-bold text-founder-600 transition hover:bg-founder-50 disabled:cursor-not-allowed disabled:opacity-70",
  errorClassName = "mt-3 text-sm font-semibold text-founder-50",
  cancelPath = "/#pro",
  unauthenticatedPath = "/login",
  onboardingDiscount = false,
  showError = true,
  stripeProductId = FOUNDER_PRO_PRODUCT_ID,
}) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    setLoading(true);
    setError("");
    trackEvent("pro_upgrade_click", { location: cancelPath });

    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setLoading(false);
      router.push(unauthenticatedPath);
      return;
    }

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "founder_pro",
          stripe_product_id: stripeProductId,
          referral_code: readStoredReferralCode(),
          onboarding_discount: onboardingDiscount,
          cancel_path: cancelPath,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.url) {
        setLoading(false);
        if (showError) {
          setError(sanitizeStripeErrorMessage(payload.error ?? "Checkout konnte nicht gestartet werden."));
        } else {
          console.error("Founder Pro checkout failed");
        }
        return;
      }

      window.location.href = payload.url;
    } catch (checkoutError) {
      setLoading(false);
      if (showError) {
        setError(sanitizeStripeErrorMessage(checkoutError));
      } else {
        console.error("Founder Pro checkout failed");
      }
    }
  }

  return (
    <div className="w-full sm:w-auto">
      <button type="button" onClick={startCheckout} disabled={loading} className={className}>
        {loading ? "Checkout startet..." : label}
      </button>
      {showError && error && <p className={errorClassName}>{error}</p>}
    </div>
  );
}
