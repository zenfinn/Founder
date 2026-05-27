import { useEffect, useMemo, useRef, useState } from "react";
import { Download, PlayCircle } from "lucide-react";
import { MetricCard } from "../components/MetricCard";
import { InternalReceiptGenerator } from "../components/InternalReceiptGenerator";
import { ProFeatureLabel } from "../components/ProFeatureLabel";
import { t } from "../i18n";
import { useAuthModal } from "../context/AuthModalContext";
import { useSubscription } from "../context/SubscriptionContext";
import { TopBar } from "../components/TopBar";
import { TransactionTable } from "../components/TransactionTable";
import { useTransactionFilters } from "../hooks/useTransactionFilters";
import { exportMonthZip } from "../utils/monthlyZipExport";

function parseGermanDate(dateString) {
  if (dateString == null || dateString === "") {
    return new Date(NaN);
  }
  const s = String(dateString).trim();
  const dotParts = s.split(".");
  if (dotParts.length === 3) {
    const [day, month, year] = dotParts.map((p) => Number(p));
    if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
      const parsed = Date.parse(s);
      return Number.isFinite(parsed) ? new Date(parsed) : new Date(NaN);
    }
    return new Date(year, month - 1, day);
  }
  const parsed = Date.parse(s);
  return Number.isFinite(parsed) ? new Date(parsed) : new Date(NaN);
}

function getQuarter(monthIndex) {
  return Math.floor(monthIndex / 3) + 1;
}

function getPeriodKey(dateString, timeRange) {
  const date = parseGermanDate(dateString);
  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  if (timeRange === "day") {
    return `${year}-${month}-${day}`;
  }

  if (timeRange === "month") {
    return `${year}-${month}`;
  }

  if (timeRange === "quarter") {
    return `${year}-Q${getQuarter(date.getMonth())}`;
  }

  return String(year);
}

function formatPeriodLabel(periodValue, timeRange, language) {
  if (!periodValue || periodValue === "unknown") {
    return "—";
  }
  const locale = language === "en" ? "en-US" : "de-DE";
  if (timeRange === "month") {
    const [year, month] = periodValue.split("-");
    const label = new Date(Number(year), Number(month) - 1, 1).toLocaleString(locale, { month: "long" });
    return `${label[0].toUpperCase()}${label.slice(1)} ${year}`;
  }

  if (timeRange === "quarter") {
    return language === "en" ? periodValue.replace("-Q", " Quarter ") : periodValue.replace("-Q", " Quartal ");
  }

  return periodValue;
}

function buildMissingReceiptsCsv(rows) {
  const header = "Datum,Händler,Kategorie,Betrag,Status";
  const lines = rows.map(
    (row) =>
      `${row.date},${row.vendor},${row.category},${row.amount.toFixed(2).replace(".", ",")},Kein Beleg gefunden`
  );

  return [header, ...lines].join("\n");
}

export function DashboardPage({
  viewMode,
  language,
  onLanguageChange,
  onRequestReceipt,
  topBarAuth,
  transactions = [],
  liveScan,
}) {
  const [internalReceiptTransaction, setInternalReceiptTransaction] = useState(null);
  const [isExportingMonth, setIsExportingMonth] = useState(false);
  const hasAutoStartedFromUrl = useRef(false);
  const { trialDaysRemaining, user, requirePro } = useSubscription();
  const { openAuthModal } = useAuthModal();

  const trialNotice =
    user && trialDaysRemaining !== null
      ? trialDaysRemaining === 0
        ? t(language, "trialBarLast")
        : t(language, "trialBar", { days: trialDaysRemaining })
      : null;

  function requireAuthThenPro(action) {
    if (!user) {
      openAuthModal();
      return;
    }
    requirePro(action);
  }

  function handleLiveScanStart() {
    if (!user) {
      openAuthModal();
      return;
    }
    // Logged-in users should be able to trigger real Gmail scan directly.
    startLiveScan();
  }

  const [timeRange, setTimeRange] = useState("month");
  const periodOptions = useMemo(() => {
    const unique = new Set(transactions.map((item) => getPeriodKey(item.date, timeRange)));
    return Array.from(unique).sort((left, right) => (left < right ? 1 : -1));
  }, [transactions, timeRange]);
  const [selectedPeriod, setSelectedPeriod] = useState("");

  useEffect(() => {
    setSelectedPeriod(periodOptions[0] ?? "");
  }, [periodOptions]);

  const periodTransactions = useMemo(() => {
    if (!selectedPeriod) {
      return transactions;
    }

    return transactions.filter((item) => getPeriodKey(item.date, timeRange) === selectedPeriod);
  }, [transactions, timeRange, selectedPeriod]);

  const {
    searchValue,
    setSearchValue,
    filterMode,
    setFilterMode,
    filteredTransactions,
  } = useTransactionFilters(periodTransactions);

  const stats = useMemo(() => {
    const foundCount = periodTransactions.filter((item) => item.receiptFound).length;
    const missingCount = periodTransactions.filter((item) => !item.receiptFound).length;
    return { foundCount, missingCount };
  }, [periodTransactions]);

  const missingRows = useMemo(
    () => periodTransactions.filter((transaction) => !transaction.receiptFound),
    [periodTransactions]
  );
  const {
    isScanning,
    progress,
    statusText,
    errorMessage,
    isConnected,
    scanResults,
    startLiveScan,
  } = liveScan;

  const subtitle =
    viewMode === "transactions"
      ? t(language, "dashboardSubtitle")
      : t(language, "dashboardSubtitle");

  const periodLabel = selectedPeriod
    ? formatPeriodLabel(selectedPeriod, timeRange, language)
    : t(language, "periodCurrent");

  function handleExportMissing() {
    const csv = buildMissingReceiptsCsv(missingRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const fileName = `fehlende_belege_${selectedPeriod || "zeitraum"}.csv`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleMonthExport() {
    if (timeRange !== "month" || !selectedPeriod) {
      window.alert(t(language, "monthExportSelectMonth"));
      return;
    }

    requireAuthThenPro(() => {
      setIsExportingMonth(true);
      exportMonthZip({
        transactions,
        selectedMonth: selectedPeriod,
        language,
      })
        .catch((error) => {
          console.error("Month export failed:", error);
        })
        .finally(() => {
          setIsExportingMonth(false);
        });
    });
  }

  useEffect(() => {
    if (!user || hasAutoStartedFromUrl.current) return;

    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const tokenFromHash = hashParams.get("access_token") || hashParams.get("token");
    const codeFromSearch = searchParams.get("code");
    const expiresIn = Number(hashParams.get("expires_in") || "3600");

    if (!tokenFromHash && !codeFromSearch) return;

    hasAutoStartedFromUrl.current = true;
    window.history.replaceState({}, document.title, window.location.pathname);

    if (tokenFromHash) {
      startLiveScan({ accessToken: tokenFromHash, expiresIn });
      return;
    }

    // If provider returns only code, we still attempt scan flow.
    startLiveScan();
  }, [user, startLiveScan]);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar
        subtitle={subtitle}
        language={language}
        onLanguageChange={onLanguageChange}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        periodOptions={periodOptions}
        selectedPeriod={selectedPeriod}
        onSelectedPeriodChange={setSelectedPeriod}
        trialNotice={trialNotice}
        user={topBarAuth?.user}
        onSignIn={topBarAuth?.onSignIn}
        onLogout={topBarAuth?.onLogout}
        planBadge={topBarAuth?.planBadge}
      />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 sm:px-8">
        <section className="grid gap-4 md:grid-cols-2">
          <MetricCard
            title={t(language, "metricFound")}
            value={stats.foundCount}
            trend={periodLabel}
            helperText={t(language, "metricFoundHelper")}
            accent="green"
          />
          <MetricCard
            title={t(language, "metricMissing")}
            value={stats.missingCount}
            trend={periodLabel}
            helperText={t(language, "metricMissingHelper")}
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p>{t(language, "infoMissing")}</p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleLiveScanStart}
                disabled={isScanning}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <PlayCircle className="h-4 w-4" />
                {t(language, "liveScanStart")}
              </button>
              <button
                type="button"
                onClick={handleMonthExport}
                disabled={isExportingMonth}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Download className="h-4 w-4" />
                {isExportingMonth ? t(language, "monthExportBusy") : t(language, "monthExportZip")}
              </button>
              <button
                onClick={handleExportMissing}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <Download className="h-4 w-4" />
                {t(language, "exportMissing")}
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">{t(language, "liveScanStatus")}</h3>
              <ProFeatureLabel language={language} />
            </div>
            <span className="text-xs text-slate-500">
              {isConnected ? t(language, "authConnected") : t(language, "authDisconnected")}
            </span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-4 rounded-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-700">{statusText}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">{progress}%</p>
          <p className="mt-1 text-xs text-slate-400">{t(language, "liveScanProCaption")}</p>
          {errorMessage ? <p className="mt-1 text-sm text-rose-600">{errorMessage}</p> : null}
        </section>

        {user && scanResults.length > 0 ? (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">{t(language, "gmailScanResultsTitle")}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">{t(language, "emailDate")}</th>
                    <th className="px-3 py-2 font-medium">{t(language, "emailSender")}</th>
                    <th className="px-3 py-2 font-medium">{t(language, "emailSubject")}</th>
                  </tr>
                </thead>
                <tbody>
                  {scanResults.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100 text-slate-700">
                      <td className="px-3 py-3 whitespace-nowrap text-slate-800">{row.date}</td>
                      <td className="px-3 py-3 text-slate-700">{row.sender}</td>
                      <td className="px-3 py-3 font-medium text-slate-900">{row.subject}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {user && transactions.length === 0 && scanResults.length === 0 && !isScanning ? (
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">{t(language, "tableVendor")}</th>
                    <th className="px-3 py-2 font-medium">{t(language, "tableDate")}</th>
                    <th className="px-3 py-2 font-medium">{t(language, "tableCategory")}</th>
                    <th className="px-3 py-2 font-medium">{t(language, "tableAmount")}</th>
                    <th className="px-3 py-2 font-medium">{t(language, "tableStatus")}</th>
                  </tr>
                </thead>
              </table>
            </div>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 py-14 text-center">
              <p className="max-w-xl px-4 text-sm text-slate-600">{t(language, "dashboardNoRealDataYet")}</p>
              <button
                type="button"
                onClick={handleLiveScanStart}
                disabled={isScanning}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <PlayCircle className="h-5 w-5" />
                {t(language, "dashboardLiveScanBigCta")}
              </button>
            </div>
          </section>
        ) : (
          <TransactionTable
            language={language}
            rows={filteredTransactions}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            filterMode={filterMode}
            onFilterChange={setFilterMode}
            onRequestReceipt={(tx) => requireAuthThenPro(() => onRequestReceipt(tx))}
            onCreateInternalReceipt={(tx) => {
              if (!user) {
                openAuthModal();
                return;
              }
              setInternalReceiptTransaction(tx);
            }}
            proBadge={<ProFeatureLabel language={language} />}
          />
        )}
      </main>

      <InternalReceiptGenerator
        open={Boolean(internalReceiptTransaction)}
        transaction={internalReceiptTransaction}
        language={language}
        onClose={() => setInternalReceiptTransaction(null)}
      />
    </div>
  );
}
