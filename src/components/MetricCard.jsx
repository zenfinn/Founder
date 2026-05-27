export function MetricCard({ title, value, trend, helperText, accent = "brand" }) {
  const accentClasses =
    accent === "green"
      ? "from-emerald-500/15 to-emerald-500/5 text-emerald-700"
      : "from-brand-500/20 to-brand-500/5 text-brand-700";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className={`mb-4 inline-flex rounded-full bg-gradient-to-r px-3 py-1 text-xs font-semibold ${accentClasses}`}>
        {trend}
      </div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-3 text-sm text-slate-500">{helperText}</p>
    </article>
  );
}
