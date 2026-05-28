import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "Datenschutzerklärung | Founder",
  description: "Datenschutzerklärung von Zndr Supply – Finn Zender.",
};

export default function DatenschutzPage() {
  return (
    <LegalPage eyebrow="Datenschutz" title="Datenschutzerklärung">
      <section>
        <h2 className="font-serif text-2xl font-bold text-white">1. Datenschutz auf einen Blick</h2>
        <p className="mt-3">
          Der Schutz Ihrer persönlichen Daten ist uns ein wichtiges Anliegen. Wir behandeln Ihre personenbezogenen Daten
          vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften (DSGVO) sowie dieser
          Datenschutzerklärung.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl font-bold text-white">2. Verantwortliche Stelle</h2>
        <p className="mt-3">Verantwortlich für die Datenverarbeitung auf dieser Website ist:</p>
        <p className="mt-3">
          Finn Zender
          <br />
          Zndr Supply
          <br />
          Im Mühlenfeld 15
          <br />
          66687 Wadern
          <br />
          E-Mail:{" "}
          <a href="mailto:zndr.supply@gmail.com" className="text-founder-200 underline underline-offset-2 hover:text-white">
            zndr.supply@gmail.com
          </a>
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl font-bold text-white">3. Datenerfassung auf unserer Website</h2>
        <ul className="mt-3 list-disc space-y-3 pl-5 leading-8">
          <li>
            <strong className="font-semibold text-white">Registrierungs- und Profildaten:</strong> Wenn Sie sich auf
            unserer Plattform registrieren, speichern wir die von Ihnen eingegebenen Daten zur Durchführung des
            Nutzungsverhältnisses.
          </li>
          <li>
            <strong className="font-semibold text-white">Server-Log-Files:</strong> Der Provider der Seiten erhebt und
            speichert automatisch Informationen in sogenannten Server-Log-Dateien, die Ihr Browser automatisch an uns
            übermittelt.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl font-bold text-white">4. Ihre Rechte</h2>
        <p className="mt-3">
          Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten
          personenbezogenen Daten. Sie haben außerdem ein Recht auf Berichtigung, Sperrung oder Löschung dieser Daten.
          Wenden Sie sich hierzu einfach an die oben genannte E-Mail-Adresse.
        </p>
      </section>
    </LegalPage>
  );
}
