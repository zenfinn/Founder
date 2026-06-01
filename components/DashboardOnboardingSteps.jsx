"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Gift, Settings, ShieldCheck, Sparkles, X } from "lucide-react";
import { dashboardSteps, founderPro } from "@/lib/founder-data";
import { isFounderPro } from "@/lib/membership";
import { readStoredReferralCode } from "@/components/ReferralCapture";
import { sanitizeStripeErrorMessage } from "@/lib/stripe-errors";
import {
  getAutoCompletedSteps,
  getOnboardingProgressPercent,
  isOnboardingComplete,
  mergeOnboardingSteps,
  ONBOARDING_DISCOUNT_PERCENT,
  readOnboardingProgress,
  writeOnboardingProgress,
} from "@/lib/onboarding-steps";

const stepIcons = {
  profile: Settings,
  verify: ShieldCheck,
  community: Sparkles,
};

const stepLinks = {
  profile: "/profile/edit",
  verify: "/profile/verify",
  community: "/community",
};

const founderProStripeProductId =
  process.env.NEXT_PUBLIC_FOUNDER_PRO_STRIPE_PRICE_OR_PRODUCT_ID ?? "prod_UYfGh1P7PJkCin";

function OnboardingRewardModal({ onClose, onUpgrade, upgrading, error }) {
  const discountedPrice = "11,99 EUR";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-reward-title"
    >
      <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-founder-200 bg-white shadow-2xl shadow-founder-950/25">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
          aria-label="Schließen"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="bg-gradient-to-br from-founder-600 to-founder-700 px-8 pb-10 pt-12 text-center text-white sm:px-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
            <Gift className="h-8 w-8" />
          </div>
          <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-founder-100">Onboarding abgeschlossen</p>
          <h2 id="onboarding-reward-title" className="mt-3 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            {ONBOARDING_DISCOUNT_PERCENT}% Rabatt auf Founder Pro
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-founder-50 sm:text-base">
            Du hast alle Schritte erledigt. Sichere dir jetzt Pro zum Sonderpreis — das Angebot bleibt sichtbar, bis du es
            schließt.
          </p>
        </div>

        <div className="px-8 py-8 sm:px-10 sm:py-9">
          <div className="rounded-2xl bg-slate-50 p-6 text-center">
            <p className="text-sm font-semibold text-slate-500 line-through">{founderPro.price} / Monat</p>
            <p className="mt-1 font-serif text-4xl font-bold text-slate-950 sm:text-5xl">{discountedPrice}</p>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-founder-600">Erster Monat mit Rabatt</p>
          </div>

          <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-600">
            {founderPro.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-founder-600" />
                {benefit}
              </li>
            ))}
          </ul>

          {error && <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

          <button
            type="button"
            onClick={onUpgrade}
            disabled={upgrading}
            className="mt-8 w-full rounded-2xl bg-founder-600 px-6 py-4 text-base font-bold text-white transition hover:bg-founder-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {upgrading ? "Checkout startet..." : `Pro für ${discountedPrice} sichern`}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DashboardOnboardingSteps({ userId, profile, verificationStatus, communitiesCount, subgroupsCount }) {
  const proMember = isFounderPro(profile);
  const currentRank = profile?.current_rank ?? "aspiring";

  const autoCompleted = useMemo(
    () =>
      getAutoCompletedSteps({
        profile,
        verificationStatus,
        currentRank,
        communitiesCount,
        subgroupsCount,
      }),
    [profile, verificationStatus, currentRank, communitiesCount, subgroupsCount]
  );

  const [steps, setSteps] = useState(() => mergeOnboardingSteps(readOnboardingProgress(userId), autoCompleted));
  const [showReward, setShowReward] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    if (!userId) return;
    const merged = mergeOnboardingSteps(readOnboardingProgress(userId), autoCompleted);
    setSteps(merged);
    writeOnboardingProgress(userId, merged);
  }, [userId, autoCompleted]);

  useEffect(() => {
    if (!userId || proMember || steps.rewardDismissed) return;
    if (isOnboardingComplete(steps)) {
      setShowReward(true);
    }
  }, [steps, userId, proMember]);

  function toggleStep(stepId) {
    if (!userId) return;
    const next = { ...steps, [stepId]: !steps[stepId] };
    setSteps(next);
    writeOnboardingProgress(userId, next);

    if (isOnboardingComplete(next) && !proMember && !next.rewardDismissed) {
      setShowReward(true);
    }
  }

  function dismissReward() {
    const next = { ...steps, rewardDismissed: true };
    setSteps(next);
    writeOnboardingProgress(userId, next);
    setShowReward(false);
  }

  async function startDiscountCheckout() {
    setUpgrading(true);
    setCheckoutError("");

    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "founder_pro",
        stripe_product_id: founderProStripeProductId,
        onboarding_discount: true,
        referral_code: readStoredReferralCode(),
        cancel_path: "/dashboard",
      }),
    });

    const payload = await response.json();
    if (!response.ok || !payload.url) {
      setCheckoutError(sanitizeStripeErrorMessage(payload.error ?? "Checkout konnte nicht gestartet werden."));
      setUpgrading(false);
      return;
    }

    window.location.href = payload.url;
  }

  const progress = getOnboardingProgressPercent(steps);
  const complete = isOnboardingComplete(steps);

  return (
    <>
      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-2xl font-bold text-slate-950">Nächste Schritte</h2>
          <span className="rounded-full bg-founder-50 px-3 py-1 text-xs font-bold text-founder-700">{progress}%</span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-founder-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-4 space-y-2">
          {dashboardSteps.map((step) => {
            const Icon = stepIcons[step.id] ?? Sparkles;
            const checked = steps[step.id];
            const href = stepLinks[step.id];
            const autoDone = autoCompleted[step.id];

            return (
              <div
                key={step.id}
                className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
                  checked ? "border-emerald-100 bg-emerald-50/50" : "border-slate-100 bg-slate-50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleStep(step.id)}
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition ${
                    checked
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-300 bg-white text-transparent hover:border-founder-400"
                  }`}
                  aria-label={checked ? `${step.title} als erledigt markiert` : `${step.title} abhaken`}
                >
                  <Check className="h-4 w-4" strokeWidth={3} />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Icon className="h-4 w-4 text-founder-600" />
                    <p className={`font-bold ${checked ? "text-slate-500 line-through" : "text-slate-950"}`}>{step.title}</p>
                    {autoDone && !checked && (
                      <span className="rounded-full bg-founder-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-founder-700">
                        Bereit
                      </span>
                    )}
                    {checked && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                        Erledigt
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{step.description}</p>
                  {href && !checked && (
                    <Link href={href} className="mt-2 inline-flex text-xs font-bold text-founder-600 hover:underline">
                      Jetzt starten →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {complete && !proMember && (
          <button
            type="button"
            onClick={() => setShowReward(true)}
            className="mt-4 w-full rounded-2xl bg-gradient-to-r from-founder-600 to-founder-700 px-4 py-3 text-sm font-bold text-white transition hover:opacity-95"
          >
            🎁 {ONBOARDING_DISCOUNT_PERCENT}% Pro-Rabatt anzeigen
          </button>
        )}
      </div>

      {showReward && !proMember && (
        <OnboardingRewardModal
          onClose={dismissReward}
          onUpgrade={startDiscountCheckout}
          upgrading={upgrading}
          error={checkoutError}
        />
      )}
    </>
  );
}
