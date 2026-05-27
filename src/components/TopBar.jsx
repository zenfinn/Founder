import { t } from "../i18n";

export function TopBar({
  subtitle,
  language,
  onLanguageChange,
  timeRange,
  onTimeRangeChange,
  periodOptions = [],
  selectedPeriod,
  onSelectedPeriodChange,
  trialNotice,
  onLogout,
  user,
  onSignIn,
  planBadge,
}) {
  const rangeOptions = [
    { id: "day", label: t(language, "rangeDay") },
    { id: "month", label: t(language, "rangeMonth") },
    { id: "quarter", label: t(language, "rangeQuarter") },
    { id: "year", label: t(language, "rangeYear") },
  ];

  return (
    <header className="border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <a
            href="/"
            className="inline-flex shrink-0 items-center self-center text-slate-900 no-underline transition hover:text-slate-800"
          >
            <span className="text-xl font-bold leading-tight tracking-tight sm:text-2xl">Receipto</span>
          </a>
          <div className="min-w-0">
            {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
            {trialNotice ? (
              <p className="mt-2 inline-flex max-w-xl items-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-900">
                {trialNotice}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {planBadge?.label ? (
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                  planBadge.variant === "pro"
                    ? "border-violet-300/80 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_14px_rgba(139,92,246,0.45)]"
                    : planBadge.variant === "trial"
                      ? "border-indigo-200 bg-indigo-50 text-indigo-900"
                      : "border-slate-200 bg-slate-100 text-slate-600"
                }`}
              >
                {planBadge.label}
              </span>
            ) : null}
            {!user && typeof onSignIn === "function" ? (
              <button
                type="button"
                onClick={onSignIn}
                className="inline-flex h-9 shrink-0 items-center rounded-xl bg-slate-900 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                {t(language, "signIn")}
              </button>
            ) : null}
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-500">
            {t(language, "languageLabel")}
            <select
              value={language}
              onChange={(event) => onLanguageChange(event.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-slate-400"
            >
              <option value="de">DE</option>
              <option value="en">EN</option>
            </select>
          </label>
          {user && typeof onLogout === "function" ? (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex h-9 items-center rounded-2xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              {t(language, "logOut")}
            </button>
          ) : null}
        </div>
      </div>

      {timeRange ? (
        <div className="mt-4 flex flex-col gap-2 border-t border-slate-200 pt-3 md:flex-row md:items-center md:justify-between">
          <div className="inline-flex rounded-lg border border-slate-200 p-1">
            {rangeOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => onTimeRangeChange(option.id)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  timeRange === option.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <select
            value={selectedPeriod}
            onChange={(event) => onSelectedPeriodChange(event.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
          >
            {periodOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </header>
  );
}
