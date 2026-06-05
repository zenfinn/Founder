"use client";

export function DashboardLanguageSwitcher({ locale, onChange }) {
  return (
    <div
      className="flex shrink-0 rounded-lg border border-[#1a3aad]/30 p-0.5 text-[11px] font-semibold"
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => onChange("de")}
        className={`rounded-md px-2 py-1 transition ${
          locale === "de" ? "bg-[#1a3aad] text-white" : "text-neutral-400 hover:text-neutral-200"
        }`}
      >
        DE
      </button>
      <button
        type="button"
        onClick={() => onChange("en")}
        className={`rounded-md px-2 py-1 transition ${
          locale === "en" ? "bg-[#1a3aad] text-white" : "text-neutral-400 hover:text-neutral-200"
        }`}
      >
        EN
      </button>
    </div>
  );
}
