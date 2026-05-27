import { useEffect, useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import { t } from "../i18n";
import { TopBar } from "../components/TopBar";
import { useSubscription } from "../context/SubscriptionContext";
import { useAuthModal } from "../context/AuthModalContext";
import { exportMonthZip } from "../utils/monthlyZipExport";

function toIsoDate(dateString) {
  const [day, month, year] = dateString.split(".");
  return `${year}-${month}-${day}`;
}

function sanitizeVendor(vendor) {
  return vendor.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "").toUpperCase();
}

function formatAmount(amount) {
  return amount.toFixed(2);
}

function createLexwareFilename(receipt) {
  return `${toIsoDate(receipt.date)}_${sanitizeVendor(receipt.vendor)}_${formatAmount(receipt.amount)}.pdf`;
}

function escapePdfText(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildReceiptPdf(receipt, language) {
  const amountFormatter = new Intl.NumberFormat(language === "en" ? "en-US" : "de-DE", {
    style: "currency",
    currency: "EUR",
  });
  const lines = [
    "Receipto - Belegexport",
    "",
    `${t(language, "tableVendor")}: ${receipt.vendor}`,
    `${t(language, "tableDate")}: ${receipt.date}`,
    `Betrag: ${amountFormatter.format(receipt.amount)}`,
    "",
    t(language, "archiveImportReady"),
  ];

  const streamText = `BT
/F1 14 Tf
50 790 Td
18 TL
${lines.map((line) => `(${escapePdfText(line)}) Tj T*`).join("\n")}
ET`;

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n",
    `4 0 obj\n<< /Length ${streamText.length} >>\nstream\n${streamText}\nendstream\nendobj\n`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((objectContent) => {
    offsets.push(pdf.length);
    pdf += objectContent;
  });

  const xrefOffset = pdf.length;
  pdf += `xref
0 ${objects.length + 1}
0000000000 65535 f 
`;

  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n 
`;
  }

  pdf += `trailer
<< /Size ${objects.length + 1} /Root 1 0 R >>
startxref
${xrefOffset}
%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

export function ReceiptArchivePage({ language, onLanguageChange, receipts, allTransactions = [], topBarAuth }) {
  const [lastDownloadedName, setLastDownloadedName] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [isExportingMonth, setIsExportingMonth] = useState(false);
  const { user, requirePro } = useSubscription();
  const { openAuthModal } = useAuthModal();
  const amountFormatter = new Intl.NumberFormat(language === "en" ? "en-US" : "de-DE", {
    style: "currency",
    currency: "EUR",
  });

  const monthOptions = useMemo(() => {
    const keys = new Set(
      (allTransactions ?? []).map((row) => {
        const [day, month, year] = String(row.date ?? "").split(".");
        if (!day || !month || !year) return "";
        return `${year}-${month}`;
      })
    );
    return Array.from(keys)
      .filter(Boolean)
      .sort((a, b) => (a < b ? 1 : -1));
  }, [allTransactions]);

  useEffect(() => {
    setSelectedMonth((current) => current || monthOptions[0] || "");
  }, [monthOptions]);

  function requireAuthThenPro(action) {
    if (!user) {
      openAuthModal();
      return;
    }
    requirePro(action);
  }

  function handleDownload(receipt) {
    const fileName = createLexwareFilename(receipt);
    const blob = buildReceiptPdf(receipt, language);
    const blobUrl = URL.createObjectURL(blob);
    const tempLink = document.createElement("a");
    tempLink.href = blobUrl;
    tempLink.download = fileName;
    tempLink.click();
    URL.revokeObjectURL(blobUrl);
    setLastDownloadedName(fileName);
  }

  function handleMonthExport() {
    if (!selectedMonth) return;
    requireAuthThenPro(() => {
      setIsExportingMonth(true);
      exportMonthZip({
        transactions: allTransactions,
        selectedMonth,
        language,
      })
        .catch((error) => {
          console.error("Archive month export failed:", error);
        })
        .finally(() => {
          setIsExportingMonth(false);
        });
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar
        subtitle={t(language, "archiveSubtitle")}
        language={language}
        onLanguageChange={onLanguageChange}
        user={topBarAuth?.user}
        onSignIn={topBarAuth?.onSignIn}
        onLogout={topBarAuth?.onLogout}
        planBadge={topBarAuth?.planBadge}
      />

      <main className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8">
        <section className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">{t(language, "monthExportMonthLabel")}</label>
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
              >
                {monthOptions.map((monthKey) => (
                  <option key={monthKey} value={monthKey}>
                    {monthKey}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleMonthExport}
              disabled={!selectedMonth || isExportingMonth}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Download className="h-4 w-4" />
              {isExportingMonth ? t(language, "monthExportBusy") : t(language, "monthExportZip")}
            </button>
          </div>
        </section>

        {lastDownloadedName ? (
          <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            {t(language, "archiveLastDownload")}: <span className="font-semibold text-slate-800">{lastDownloadedName}</span>
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {receipts.map((receipt) => (
            <article key={receipt.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <FileText className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{receipt.vendor}</h3>
                  <p className="text-sm text-slate-500">{t(language, "archiveInvoiceFrom")} {receipt.date}</p>
                </div>
              </div>

              <p className="mb-5 text-sm text-slate-600">
                {t(language, "tableAmount")}:{" "}
                <span className="font-semibold text-slate-900">{amountFormatter.format(receipt.amount)}</span>
              </p>

              <button
                onClick={() => handleDownload(receipt)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Download className="h-4 w-4" />
                {t(language, "archiveDownload")}
              </button>

              <p className="mt-2 text-center text-xs text-slate-500">
                {t(language, "archiveImportReady")}
              </p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
