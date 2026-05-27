import { FileSignature, FileWarning, Filter, Search } from "lucide-react";
import { t } from "../i18n";
import { StatusBadge } from "./StatusBadge";

export function TransactionTable({
  language,
  rows,
  searchValue,
  onSearchChange,
  filterMode,
  onFilterChange,
  onRequestReceipt,
  onCreateInternalReceipt,
  proBadge,
}) {
  const labels = {
    receiptFound: t(language, "receiptFound"),
    receiptMissing: t(language, "receiptMissing"),
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">{t(language, "sidebarDashboard")}</h2>
            {proBadge}
          </div>
          <p className="text-sm text-slate-500">{t(language, "dashboardSubtitle")}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={t(language, "tableSearch")}
              className="h-10 rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none ring-brand-300 transition focus:border-brand-300 focus:ring-2"
            />
          </label>

          <div className="inline-flex rounded-xl border border-slate-200 p-1">
            <button
              onClick={() => onFilterChange("all")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filterMode === "all" ? "bg-brand-500 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Filter className="mr-1 inline h-3.5 w-3.5" />
              {t(language, "tableAll")}
            </button>
            <button
              onClick={() => onFilterChange("found")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filterMode === "found" ? "bg-brand-500 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t(language, "tableFound")}
            </button>
            <button
              onClick={() => onFilterChange("missing")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filterMode === "missing" ? "bg-brand-500 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t(language, "tableMissing")}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2 font-medium">{t(language, "tableVendor")}</th>
              <th className="px-3 py-2 font-medium">{t(language, "tableDate")}</th>
              <th className="px-3 py-2 font-medium">{t(language, "tableCategory")}</th>
              <th className="px-3 py-2 font-medium">{t(language, "tableAmount")}</th>
              <th className="px-3 py-2 font-medium">{t(language, "tableStatus")}</th>
              <th className="px-3 py-2 font-medium">{t(language, "tableVat")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((transaction) => {
              const currencyFormatter = new Intl.NumberFormat(language === "en" ? "en-US" : "de-DE", {
                style: "currency",
                currency: transaction.currency ?? "EUR",
              });
              return (
              <tr
                key={transaction.id}
                className={`rounded-xl text-slate-700 ${
                  transaction.receiptFound ? "bg-slate-50" : "bg-rose-50 ring-1 ring-rose-200"
                }`}
              >
                <td className="rounded-l-xl px-3 py-3 font-medium text-slate-900">
                  {t(language, "tableOrderFrom")}: {transaction.vendor}
                </td>
                <td className="px-3 py-3">{transaction.date}</td>
                <td className="px-3 py-3">{transaction.category}</td>
                <td className="px-3 py-3 font-medium">{currencyFormatter.format(transaction.amount)}</td>
                <td className="px-3 py-3">
                  <StatusBadge found={transaction.receiptFound} labels={labels} />
                </td>
                <td className="rounded-r-xl px-3 py-3">
                  <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    {!transaction.receiptFound ? (
                      <button
                        type="button"
                        onClick={() => onRequestReceipt(transaction)}
                        className="inline-flex items-center justify-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-slate-800"
                      >
                        <FileWarning className="h-3.5 w-3.5 shrink-0" />
                        {t(language, "supportContact")}
                      </button>
                    ) : transaction.vatReceiptMissing ? (
                      <button
                        type="button"
                        onClick={() => onRequestReceipt(transaction)}
                        className="inline-flex items-center justify-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-200"
                      >
                        <FileWarning className="h-3.5 w-3.5 shrink-0" />
                        {t(language, "requestReceipt")}
                      </button>
                    ) : (
                      <span className="text-xs font-medium text-slate-500">OK</span>
                    )}
                    {!transaction.receiptFound && typeof onCreateInternalReceipt === "function" ? (
                      <button
                        type="button"
                        onClick={() => onCreateInternalReceipt(transaction)}
                        className="inline-flex items-center justify-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <FileSignature className="h-3.5 w-3.5 shrink-0" />
                        {t(language, "internalReceiptCreate")}
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            {t(language, "noTransactions")}
          </div>
        ) : null}
      </div>
    </section>
  );
}
