"use client";

import { useEffect } from "react";

export const FOUNDER_PRO_INTENT_KEY = "founder_pro_intent";

export function RegisterProIntent({ intent = "" }) {
  useEffect(() => {
    if (intent === "founder_pro") {
      window.sessionStorage.setItem(FOUNDER_PRO_INTENT_KEY, "1");
    }
  }, [intent]);

  if (intent !== "founder_pro") return null;

  return (
    <p className="mb-4 rounded-2xl border border-founder-200 bg-founder-50 px-4 py-3 text-sm font-semibold text-founder-800">
      Du startest mit Founder Pro. Nach der Registrierung kannst du die Pro-Mitgliedschaft direkt aktivieren.
    </p>
  );
}
