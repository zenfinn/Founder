import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { X } from "lucide-react";
import { useSubscription } from "../context/SubscriptionContext";
import { t } from "../i18n";

function defaultPurpose(transaction, language) {
  if (language === "en") {
    return `Business expense — ${transaction.vendor}`;
  }
  return `Betriebliche Ausgabe — ${transaction.vendor}`;
}

function defaultJustification(language) {
  return language === "en"
    ? "The original receipt could not be located."
    : "Der Originalbeleg ist nicht auffindbar.";
}

function buildPdfDocument({
  language,
  title,
  date,
  payee,
  purpose,
  grossAmount,
  currency,
  justification,
  signatureLabel,
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const left = 20;
  const pageW = doc.internal.pageSize.getWidth();
  let y = 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, left, y);
  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const lines = [
    [t(language, "internalPdfLabelDate"), date],
    [t(language, "internalPdfLabelPayee"), payee],
    [t(language, "internalPdfLabelPurpose"), purpose],
    [t(language, "internalPdfLabelGross"), `${grossAmount} ${currency}`],
    [t(language, "internalPdfLabelCurrency"), currency],
  ];

  for (const [label, value] of lines) {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, left, y);
    doc.setFont("helvetica", "normal");
    const wrapped = doc.splitTextToSize(String(value ?? ""), pageW - left - 50);
    doc.text(wrapped, left + 48, y);
    y += 6 + (wrapped.length - 1) * 5;
  }

  y += 4;
  doc.setFont("helvetica", "italic");
  const justLines = doc.splitTextToSize(justification, pageW - 2 * left);
  doc.text(justLines, left, y);
  y += justLines.length * 5 + 10;

  doc.setFont("helvetica", "normal");
  doc.setDrawColor(40, 40, 40);
  doc.line(left, y, left + 85, y);
  y += 6;
  doc.setFontSize(10);
  doc.text(signatureLabel, left, y);

  const safeName = String(payee || "Beleg")
    .replace(/[^\w\-]+/g, "_")
    .slice(0, 40);
  doc.save(`${language === "en" ? "Internal_receipt" : "Eigenbeleg"}_${safeName}.pdf`);
}

export function InternalReceiptGenerator({ open, onClose, language, transaction }) {
  const { requirePro } = useSubscription();
  const [date, setDate] = useState("");
  const [payee, setPayee] = useState("");
  const [purpose, setPurpose] = useState("");
  const [grossAmount, setGrossAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [justification, setJustification] = useState("");

  useEffect(() => {
    if (!transaction) return;
    setDate(transaction.date ?? "");
    setPayee(transaction.vendor ?? "");
    setGrossAmount(Number(transaction.amount ?? 0).toFixed(2));
    setCurrency(transaction.currency ?? "EUR");
    setPurpose(defaultPurpose(transaction, language));
    setJustification(defaultJustification(language));
  }, [transaction, language]);

  if (!open || !transaction) {
    return null;
  }

  const title = language === "en" ? "Internal receipt / Substitute document" : "Eigenbeleg / Ersatzbeleg";

  function handleDownload() {
    requirePro(() => {
      buildPdfDocument({
        language,
        title,
        date,
        payee,
        purpose,
        grossAmount,
        currency,
        justification,
        signatureLabel: t(language, "internalPdfSignatureLine"),
      });
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-900">{t(language, "internalReceiptTitle")}</h3>
            <p className="mt-1 text-sm text-slate-500">{t(language, "internalReceiptSubtitle")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="font-medium text-slate-700">{t(language, "internalPdfLabelDate")}</span>
            <input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300"
            />
          </label>
          <label className="block">
            <span className="font-medium text-slate-700">{t(language, "internalPdfLabelPayee")}</span>
            <input
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300"
            />
          </label>
          <label className="block">
            <span className="font-medium text-slate-700">{t(language, "internalPdfLabelPurpose")}</span>
            <input
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="font-medium text-slate-700">{t(language, "internalPdfLabelGross")}</span>
              <input
                value={grossAmount}
                onChange={(e) => setGrossAmount(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300"
              />
            </label>
            <label className="block">
              <span className="font-medium text-slate-700">{t(language, "internalPdfLabelCurrency")}</span>
              <input
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300"
              />
            </label>
          </div>
          <label className="block">
            <span className="font-medium text-slate-700">{t(language, "internalPdfLabelJustification")}</span>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={3}
              className="mt-1 w-full resize-y rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300"
            />
          </label>
        </div>

        <p className="mt-4 text-xs text-slate-500">{t(language, "internalReceiptProHint")}</p>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            {t(language, "modalCancel")}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {t(language, "internalReceiptDownload")}
          </button>
        </div>
      </div>
    </div>
  );
}
