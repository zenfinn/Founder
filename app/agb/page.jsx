import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "AGB | Founder",
  description: "Allgemeine Geschäftsbedingungen von Zndr Supply.",
};

export default function AgbPage() {
  return (
    <LegalPage eyebrow="Nutzungsbedingungen" title="Allgemeine Geschäftsbedingungen (AGB)">
      <section>
        <h2 className="font-serif text-2xl font-bold text-white">§ 1 Geltungsbereich und Anbieter</h2>
        <p className="mt-3">
          Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge, Nutzungen und Dienstleistungen zwischen Zndr
          Supply, Inhaber Finn Zender, Im Mühlenfeld 15, 66687 Wadern und den Nutzern bzw. Kunden der Plattform.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl font-bold text-white">§ 2 Vertragsschluss und Registrierung</h2>
        <p className="mt-3">
          (1) Für die Nutzung bestimmter Funktionen oder Bereiche ist eine Registrierung erforderlich. Ein Anspruch auf
          Mitgliedschaft besteht nicht.
        </p>
        <p>
          (2) Mit der Absendung der Registrierung oder dem Kauf eines Zugangs gibt der Nutzer ein verbindliches Angebot
          zum Vertragsschluss ab. Der Vertrag kommt erst durch die Freischaltung oder Bestätigung des Anbieters zustande.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl font-bold text-white">§ 3 Nutzungsregeln und Verhalten auf der Plattform</h2>
        <p className="mt-3">
          (1) Der Nutzer verpflichtet sich, keine Inhalte zu veröffentlichen, die gegen geltendes Recht, gute Sitten
          oder Rechte Dritter verstoßen. Spam, Beleidigungen und geschäftsschädigende Aktivitäten sind untersagt.
        </p>
        <p>
          (2) Der Anbieter behält sich das Recht vor, Beiträge bei Verstößen zu löschen und Nutzer temporär oder
          dauerhaft zu sperren.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl font-bold text-white">§ 4 Haftungsbeschränkung</h2>
        <p className="mt-3">
          (1) Der Anbieter übernimmt keine Gewähr für die ununterbrochene Verfügbarkeit der Plattform sowie für die
          Richtigkeit der von Nutzern oder Mentoren bereitgestellten Inhalte.
        </p>
        <p>
          (2) Die Haftung für leicht fahrlässige Pflichtverletzungen wird ausgeschlossen, sofern diese keine
          vertragswesentlichen Pflichten, Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit
          betreffen.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl font-bold text-white">§ 5 Schlussbestimmungen</h2>
        <p className="mt-3">
          Es gilt das Recht der Bundesrepublik Deutschland. Sollte eine Bestimmung dieser AGB unwirksam sein, bleibt die
          Wirksamkeit der übrigen Bestimmungen unberührt.
        </p>
      </section>
    </LegalPage>
  );
}
