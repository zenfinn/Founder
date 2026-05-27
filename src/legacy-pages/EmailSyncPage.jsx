import { MailSearch } from "lucide-react";
import { t } from "../i18n";
import { TopBar } from "../components/TopBar";

export function EmailSyncPage({ language, onLanguageChange, emails, topBarAuth }) {
  const amountFormatter = new Intl.NumberFormat(language === "en" ? "en-US" : "de-DE", {
    style: "currency",
    currency: "EUR",
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar
        subtitle={t(language, "emailSyncSubtitle")}
        language={language}
        onLanguageChange={onLanguageChange}
        user={topBarAuth?.user}
        onSignIn={topBarAuth?.onSignIn}
        onLogout={topBarAuth?.onLogout}
        planBadge={topBarAuth?.planBadge}
      />

      <main className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <MailSearch className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">{t(language, "emailSyncTitle")}</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 font-medium">{t(language, "emailSubject")}</th>
                  <th className="px-3 py-2 font-medium">{t(language, "emailSender")}</th>
                  <th className="px-3 py-2 font-medium">{t(language, "emailDate")}</th>
                  <th className="px-3 py-2 font-medium">{t(language, "emailAmount")}</th>
                </tr>
              </thead>
              <tbody>
                {emails.map((email) => (
                  <tr key={email.id} className="bg-slate-50 text-slate-700">
                    <td className="rounded-l-xl px-3 py-3 font-medium text-slate-900">{email.subject}</td>
                    <td className="px-3 py-3">{email.sender}</td>
                    <td className="px-3 py-3">{email.detectedDate}</td>
                    <td className="rounded-r-xl px-3 py-3 font-medium">{amountFormatter.format(email.detectedAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
