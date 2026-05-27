"use client";

import { useEffect } from "react";
import { REFERRAL_STORAGE_KEY } from "@/lib/referrals";

export function ReferralCapture({ referralCode }) {
  useEffect(() => {
    const code = String(referralCode ?? "").trim();
    if (!code) return;
    window.localStorage.setItem(REFERRAL_STORAGE_KEY, code);
  }, [referralCode]);

  return null;
}

export function readStoredReferralCode() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(REFERRAL_STORAGE_KEY)?.trim() ?? "";
}
