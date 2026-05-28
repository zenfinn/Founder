export const metadata = {
  title: "Datenschutzerklärung | Founder",
  description: "Datenschutzerklärung von Zndr Supply – Finn Zender.",
};

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-[#001220] text-white p-8 md:p-16 max-w-4xl mx-auto font-sans leading-relaxed">
      <span className="text-blue-500 font-bold uppercase tracking-wider text-sm">Rechtliches</span>
      <h1 className="text-4xl font-bold mt-2 mb-8">Datenschutzerklärung</h1>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">1. Datenschutz auf einen Blick</h2>
        <p>
          Der Schutz Ihrer persönlichen Daten ist uns ein wichtiges Anliegen. Wir behandeln Ihre personenbezogenen Daten
          vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften (DSGVO) sowie dieser
          Datenschutzerklärung.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">2. Verantwortliche Stelle</h2>
        <p>Verantwortlich für die Datenverarbeitung auf dieser Website ist:</p>
        <p className="mt-2">Finn Zender</p>
        <p>Zndr Supply</p>
        <p>Im Mühlenfeld 15</p>
        <p>66687 Wadern</p>
        <p>E-Mail: zndr.supply@gmail.com</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">3. Datenerfassung auf unserer Website</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Registrierungs- und Profildaten:</strong> Wenn Sie sich auf unserer Plattform registrieren,
            speichern wir die von Ihnen eingegebenen Daten zur Durchführung des Nutzungsverhältnisses.
          </li>
          <li>
            <strong>Server-Log-Files:</strong> Der Provider der Seiten erhebt und speichert automatisch Informationen in
            sogenannten Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt.
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">4. Ihre Rechte</h2>
        <p>
          Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Herkunft, Empfänger und Zweck Ihrer
          gespeicherten personenbezogenen Daten. Sie haben außerdem ein Recht auf Berichtigung, Sperrung oder Löschung
          dieser Daten. Wenden Sie sich hierzu einfach an die oben genannte E-Mail-Adresse.
        </p>
      </section>
    </div>
  );
}
