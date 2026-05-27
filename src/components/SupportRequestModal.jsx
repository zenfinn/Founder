import { X } from "lucide-react";
import { t } from "../i18n";
import { getSupportContactForVendor } from "../utils/supportDatabase";
import { generateOutreachEmail } from "../utils/outreachEmail";

export function SupportRequestModal({ language, transaction, onClose, onMailSent }) {
  if (!transaction) {
    return null;
  }

  const supportEmail =
    transaction.supportEmail?.trim() || getSupportContactForVendor(transaction.vendor) || "";

  const subject =
    language === "en"
      ? `Invoice request: ${transaction.vendor} — ${transaction.date}`
      : `Rechnungsanforderung: ${transaction.vendor} — ${transaction.date}`;

  const body = generateOutreachEmail(transaction.vendor, transaction.amount, transaction.date, language);

  const mailtoHref = supportEmail
    ? `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-900">{t(language, "supportModalTitle")}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {t(language, "supportModalPrepared")}{" "}
              <span className="font-semibold text-slate-700">{transaction.vendor}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
          <p>
            <span className="font-semibold text-slate-700">{t(language, "modalTo")}:</span>{" "}
            {supportEmail || t(language, "supportModalNoEmail")}
          </p>
          <p>
            <span className="font-semibold text-slate-700">{t(language, "modalSubject")}:</span> {subject}
          </p>
          <div>
            <p className="mb-1 font-semibold text-slate-700">{t(language, "modalContent")}:</p>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-3 font-sans text-slate-700">
              {body}
            </pre>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            {t(language, "modalCancel")}
          </button>
          {mailtoHref ? (
            <a
              href={mailtoHref}
              onClick={() => {
                onMailSent?.(transaction);
              }}
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              {t(language, "modalSendEmail")}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
