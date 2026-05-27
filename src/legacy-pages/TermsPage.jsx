import { Link } from "./LegalLayout";

/**
 * Statische AGB für Google OAuth-Verifizierung (kurz, klar).
 */
export function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <span className="text-sm font-semibold tracking-tight text-slate-900">Receipto</span>
          <nav className="flex gap-4 text-sm">
            <Link href="/privacy">Datenschutz</Link>
            <Link href="/">Zur App</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Allgemeine Geschäftsbedingungen (AGB)</h1>
        <p className="mt-2 text-sm text-slate-500">Stand: April 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-slate-700">
          <section>
            <h2 className="text-lg font-semibold text-slate-900">1. Leistungsgegenstand</h2>
            <p className="mt-3">
              Receipto stellt eine Software zur Unterstützung bei der Erfassung und Organisation von
              Eingangsbelegen bereit, insbesondere durch optionalen Zugriff auf Ihr Google-Mailpostfach zur
              Identifikation relevanter Nachrichten.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">2. Gmail / Google-Nutzung</h2>
            <p className="mt-3">
              Die Anbindung an Gmail erfolgt nur mit Ihrer Einwilligung über den von Google bereitgestellten
              OAuth-Prozess. Zugriffsberechtigungen werden auf das für den Dienst erforderliche Maß beschränkt
              (z. B. Lesen von Nachrichten zur Rechnungserkennung).
            </p>
            <p className="mt-3">
              <strong>
                Von Receipto aus werden Gmail-Daten nicht an Dritte verkauft oder für Werbezwecke weitergegeben.
              </strong>{" "}
              Sie können die Verbindung jederzeit in Ihrem Google-Konto widerrufen bzw. die Nutzung von Receipto
              einstellen.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">3. Pflichten des Nutzers</h2>
            <p className="mt-3">
              Sie versichern, dass Sie zur Nutzung der verbundenen Konten berechtigt sind und keine Rechte Dritter
              verletzen. Sie sind für die inhaltliche Richtigkeit exportierter oder archivierter Daten selbst
              verantwortlich (insb. steuer- und bilanzrechtliche Prüfung).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">4. Haftung</h2>
            <p className="mt-3">
              Receipto wird mit der gebotenen Sorgfalt betrieben; eine Gewähr für die Vollständigkeit oder
              Richtigkeit automatisch erkannter Belege ist ausgeschlossen, soweit gesetzlich zulässig. Für
              leichte Fahrlässigkeit haften wir nur bei Verletzung wesentlicher Vertragspflichten, begrenzt auf
              den typischerweise vorhersehbaren Schaden.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">5. Änderungen</h2>
            <p className="mt-3">
              Wir behalten uns vor, diese AGB anzupassen, wenn sich der Dienst weiterentwickelt. Wesentliche
              Änderungen werden wir in der App oder auf dieser Seite kenntlich machen.
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 text-slate-600">
            <p className="text-xs">
              <strong className="text-slate-800">Hinweis:</strong> Diese Fassung ist bewusst kurz für die
              Google-Verifizierung. Rechtsverbindliche Unternehmensdaten (Name, Sitz, Register) können ergänzt
              werden.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Receipto
      </footer>
    </div>
  );
}
