import { X } from "lucide-react";
import { t } from "../i18n";

export function PricingOverlay({ language, open, onClose, dismissible }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl">
        {dismissible ? (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}

        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          {t(language, "pricingTitle")}
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{t(language, "pricingHeadline")}</h2>
        <p className="mt-2 text-sm text-slate-600">{t(language, "pricingSub")}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-sm font-semibold text-slate-900">Basic</h3>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              9,99€<span className="text-base font-medium text-slate-500">/Mo</span>
            </p>
            <ul className="mt-4 space-y-2 text-xs text-slate-600">
              <li>{t(language, "pricingBasic1")}</li>
              <li>{t(language, "pricingBasic2")}</li>
            </ul>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-800 transition hover:bg-white"
            >
              {t(language, "pricingChooseBasic")}
            </button>
          </div>

          <div className="rounded-xl border-2 border-brand-500 bg-gradient-to-b from-brand-50 to-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-brand-800">Pro</h3>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              24,99€<span className="text-base font-medium text-slate-500">/Mo</span>
            </p>
            <ul className="mt-4 space-y-2 text-xs text-slate-700">
              <li>{t(language, "pricingPro1")}</li>
              <li>{t(language, "pricingPro2")}</li>
              <li>{t(language, "pricingPro3")}</li>
            </ul>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {t(language, "pricingChoosePro")}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">{t(language, "pricingFootnote")}</p>
      </div>
    </div>
  );
}
