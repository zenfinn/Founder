"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function StripeCheckoutButton({ payload, children, className }) {
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
        ...payload,
        user_id: data.session.user.id,
        email: data.session.user.email,
      }),
    });

    const checkoutData = await response.json();

    if (!response.ok || !checkoutData.url) {
      setError(checkoutData.error ?? "Checkout konnte nicht gestartet werden.");
      setLoading(false);
      return;
    }

    window.location.href = checkoutData.url;
  }

  return (
    <div>
      <button type="button" onClick={startCheckout} disabled={loading} className={className}>
        {loading ? "Checkout startet..." : children}
      </button>
      {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
    </div>
  );
}
