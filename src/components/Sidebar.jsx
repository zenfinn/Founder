import { t } from "../i18n";

export function Sidebar({ activeView, onChangeView, language }) {
  const navItems = [
    { id: "dashboard", label: t(language, "sidebarDashboard") },
    { id: "ai-assistant", label: t(language, "sidebarAIAssistant") },
    { id: "email-sync", label: t(language, "sidebarEmailSync") },
  ];

  if (!Array.isArray(navItems) || navItems.length === 0) {
    return (
      <aside className="flex w-full shrink-0 items-center border-b border-slate-200/80 bg-white px-4 py-3 shadow-sm lg:w-64 lg:border-b-0 lg:border-r">
        <a href="/" className="text-slate-900 no-underline">
          <span className="text-xl font-bold tracking-tight sm:text-2xl">Receipto</span>
        </a>
      </aside>
    );
  }

  return (
    <aside className="w-full shrink-0 border-b border-slate-200/80 bg-white shadow-sm lg:w-64 lg:border-b-0 lg:border-r lg:shadow-none">
      <div className="p-4 lg:p-5">
        <div className="mb-6 border-b border-slate-100 bg-white pb-4">
          <a href="/" className="mb-2 inline-block text-slate-900 no-underline">
            <span className="text-xl font-bold tracking-tight sm:text-2xl">Receipto</span>
          </a>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">{t(language, "sidebarTitle")}</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{t(language, "sidebarSubtitle")}</p>
        </div>

        <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{t(language, "sidebarNavLabel")}</p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeView(item.id)}
                className={`flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  active
                    ? "bg-brand-50 text-brand-800 shadow-sm ring-1 ring-brand-100/80"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
