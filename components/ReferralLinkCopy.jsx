"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function ReferralLinkCopy({ label, href }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-[1.75rem] bg-founder-600 p-5 text-white">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-100">{label}</p>
      <p className="mt-3 break-all rounded-2xl bg-white px-4 py-3 text-sm font-bold text-founder-600">{href}</p>
      <button
        type="button"
        onClick={handleCopy}
        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/25"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Kopiert" : "Link kopieren"}
      </button>
    </div>
  );
}
