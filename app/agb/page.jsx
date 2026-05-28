export const metadata = {
  title: "AGB | Founder",
  description: "Allgemeine Geschäftsbedingungen von Zndr Supply.",
};

export default function AgbPage() {
  return (
    <div className="min-h-screen bg-[#001220] text-white p-8 md:p-16 max-w-4xl mx-auto font-sans leading-relaxed">
      <span className="text-blue-500 font-bold uppercase tracking-wider text-sm">Rechtliches</span>
      <h1 className="text-4xl font-bold mt-2 mb-8">Allgemeine Geschäftsbedingungen (AGB)</h1>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">§ 1 Geltungsbereich und Anbieter</h2>
        <p>
          Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge, Nutzungen und Dienstleistungen zwischen Zndr
          Supply, Inhaber Finn Zender, Im Mühlenfeld 15, 66687 Wadern und den Nutzern bzw. Kunden der Plattform.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">§ 2 Vertragsschluss und Registrierung</h2>
        <p>
          (1) Für die Nutzung bestimmter Funktionen oder Bereiche ist eine Registrierung erforderlich. Ein Anspruch auf
          Mitgliedschaft besteht nicht.
        </p>
        <p>
          (2) Mit der Absendung der Registrierung oder dem Kauf eines Zugangs gibt der Nutzer ein verbindliches Angebot
          zum Vertragsschluss ab. Der Vertrag kommt erst durch die Freischaltung oder Bestätigung des Anbieters zustande.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">§ 3 Nutzungsregeln und Verhalten auf der Plattform</h2>
        <p>
          (1) Der Nutzer verpflichtet sich, keine Inhalte zu veröffentlichen, die gegen geltendes Recht, gute Sitten
          oder Rechte Dritter verstoßen. Spam, Beleidigungen und geschäftsschädigende Aktivitäten sind untersagt.
        </p>
        <p>
          (2) Der Anbieter behält sich das Recht vor, Beiträge bei Verstößen zu löschen und Nutzer temporär oder
          dauerhaft zu sperren.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">§ 4 Haftungsbeschränkung</h2>
        <p>
          (1) Der Anbieter übernimmt keine Gewähr für die ununterbrochene Verfügbarkeit der Plattform sowie für die
          Richtigkeit der von Nutzern oder Mentoren bereitgestellten Inhalte.
        </p>
        <p>
          (2) Die Haftung für leicht fahrlässige Pflichtverletzungen wird ausgeschlossen, sofern diese keine
          vertragswesentlichen Pflichten, Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit
          betreffen.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">§ 5 Schlussbestimmungen</h2>
        <p>
          Es gilt das Recht der Bundesrepublik Deutschland. Sollte eine Bestimmung dieser AGB unwirksam sein, bleibt die
          Wirksamkeit der übrigen Bestimmungen unberührt.
        </p>
      </section>
    </div>
  );
}
