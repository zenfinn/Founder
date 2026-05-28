"use client";

import { useEffect, useState } from "react";
import { FounderProUpgradeButton } from "@/components/FounderProUpgradeButton";
import { FOUNDER_PRO_INTENT_KEY } from "@/components/RegisterProIntent";

export function FounderProIntentHandler() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.sessionStorage.getItem(FOUNDER_PRO_INTENT_KEY) === "1") {
      setVisible(true);
      window.sessionStorage.removeItem(FOUNDER_PRO_INTENT_KEY);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="mb-5 rounded-[1.5rem] border border-founder-200 bg-gradient-to-r from-[#0c1e33] to-founder-700 p-5 text-white shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-200">Founder Pro</p>
      <h2 className="mt-2 font-serif text-2xl font-bold">Pro-Mitgliedschaft aktivieren</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">
        Du hast dich für Founder Pro interessiert. Schließe jetzt dein Abo ab und sichere dir Premium-Zugang.
      </p>
      <FounderProUpgradeButton
        label="Pro beitreten"
        cancelPath="/dashboard"
        className="mt-4 inline-flex rounded-2xl bg-sky-300 px-6 py-3 text-sm font-bold text-[#0c1e33] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
        errorClassName="mt-3 text-sm font-semibold text-sky-100"
      />
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="mt-3 block text-xs font-semibold text-slate-300 underline underline-offset-2 hover:text-white"
      >
        Später entscheiden
      </button>
    </div>
  );
}
