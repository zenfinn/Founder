import { Link } from "./LegalLayout";

/**
 * Statische Datenschutzerklärung für Google OAuth-Verifizierung und Transparenz.
 */
export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <span className="text-sm font-semibold tracking-tight text-slate-900">Receipto</span>
          <nav className="flex gap-4 text-sm">
            <Link href="/terms">AGB</Link>
            <Link href="/">Zur App</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Datenschutzerklärung</h1>
        <p className="mt-2 text-sm text-slate-500">Stand: April 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-slate-700">
          <section>
            <h2 className="text-lg font-semibold text-slate-900">1. Überblick</h2>
            <p className="mt-3">
              Receipto hilft Ihnen dabei, geschäftliche Eingangsbelege aus Ihrer Mailbox zu erkennen und zu
              strukturieren. Der Schutz Ihrer Daten hat für uns hohe Priorität. Diese Seite beschreibt in
              kompakter Form, wie wir mit personenbezogenen Daten umgehen.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">2. Gmail und Google-Daten</h2>
            <p className="mt-3">
              Wenn Sie die Gmail-Anbindung nutzen, greift Receipto mit Ihrer ausdrücklichen Einwilligung und den
              von Google vorgegebenen OAuth-Berechtigungen auf Ihre Gmail-Daten zu — ausschließlich zum{" "}
              <strong>Scannen und Erkennen von Rechnungs- und Beleg-E-Mails</strong> (z. B. Betreff, Absender,
              Metadaten und Inhalte, die für die Belegerkennung erforderlich sind).
            </p>
            <p className="mt-3">
              <strong>
                Wir geben Ihre Gmail-Inhalte nicht an Dritte weiter
              </strong>{" "}
              und nutzen sie nicht zu Werbezwecken. Die Verarbeitung dient allein der von Ihnen gewünschten
              Belegverwaltung innerhalb von Receipto.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">3. Hosting und technische Dienstleister</h2>
            <p className="mt-3">
              Für Betrieb, Authentifizierung und Speicherung können technische Dienstleister eingesetzt werden
              (z. B. Hosting, Datenbank), die Daten ausschließlich im Rahmen der Auftragsverarbeitung bzw. nach
              Art. 28 DSGVO verarbeiten — nicht zu eigenen Zwecken und nicht zum Weiterverkauf von E-Mail-Inhalten.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">4. Ihre Rechte</h2>
            <p className="mt-3">
              Sie haben nach Maßgabe der DSGVO Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der
              Verarbeitung, Datenübertragbarkeit sowie Widerspruch. Kontaktieren Sie uns hierzu über die in der App
              angegebene Support-Adresse bzw. den Verantwortlichen, sobald dieser final benannt ist.
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 text-slate-600">
            <p className="text-xs">
              <strong className="text-slate-800">Hinweis:</strong> Diese Darstellung ist bewusst knapp gehalten für
              OAuth-Verifizierung. Eine ausführliche, rechtsverbindliche Fassung kann ergänzt werden, sobald
              Unternehmenssitz und Ansprechpartner final feststehen.
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
