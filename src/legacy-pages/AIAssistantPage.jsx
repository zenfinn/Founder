import { useMemo } from "react";
import { Zap } from "lucide-react";
import { t } from "../i18n";
import { useAuthModal } from "../context/AuthModalContext";
import { useSubscription } from "../context/SubscriptionContext";
import { TopBar } from "../components/TopBar";
import { GUEST_DEMO_TRANSACTIONS } from "../utils/guestDemoData";

export function AIAssistantPage({ language, onLanguageChange, onRequestReceipt, topBarAuth, transactions = [] }) {
  const { user, requirePro } = useSubscription();
  const { openAuthModal } = useAuthModal();

  const rows = useMemo(() => {
    const sourceRows = user ? transactions : GUEST_DEMO_TRANSACTIONS;
    return (sourceRows ?? []).filter((row) => !row.receiptFound);
  }, [transactions, user]);

  function handleSupportContact(transaction) {
    if (!user) {
      openAuthModal();
      return;
    }
    requirePro(() => onRequestReceipt(transaction));
  }

  const currencyFormatter = (row) =>
    new Intl.NumberFormat(language === "en" ? "en-US" : "de-DE", {
      style: "currency",
      currency: row.currency ?? "EUR",
    }).format(Number(row.amount ?? 0));

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar
        subtitle={t(language, "outreachHubSubtitle")}
        language={language}
        onLanguageChange={onLanguageChange}
        user={topBarAuth?.user}
        onSignIn={topBarAuth?.onSignIn}
        onLogout={topBarAuth?.onLogout}
        planBadge={topBarAuth?.planBadge}
      />

      <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25">
              <Zap className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">{t(language, "outreachHubTitle")}</h2>
              <p className="mt-1 max-w-xl text-sm text-slate-600">{t(language, "outreachHubIntro")}</p>
            </div>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-6">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {t(language, "outreachHubQueue")}
            </p>
          </div>

          {rows.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-slate-500">{t(language, "outreachHubEmpty")}</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col gap-4 px-4 py-5 transition hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{row.vendor}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {row.date} · {row.category}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800">{currencyFormatter(row)}</p>
                    {row.aiStatus === "request_sent" ? (
                      <p className="mt-2 inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        {t(language, "outreachStatusSent")}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSupportContact(row)}
                    className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                  >
                    {t(language, "requestReceipt")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default AIAssistantPage;
