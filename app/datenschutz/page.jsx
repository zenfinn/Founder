import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "Datenschutzerklärung | Founder",
};

export default function DatenschutzPage() {
  return (
    <LegalPage eyebrow="Datenschutz" title="Datenschutzerklärung">
      <p>
        Diese Datenschutzerklärung informiert über die Verarbeitung personenbezogener Daten bei Nutzung von Founder. Die
        Texte sind Platzhalter und müssen vor dem produktiven Start rechtlich geprüft und an die
        tatsächlichen Anbieter, Serverstandorte und Datenflüsse angepasst werden.
      </p>

      <h2>Verantwortlicher</h2>
      <p>
        Verantwortlicher im Sinne der Datenschutz-Grundverordnung ist Founder, Musterstraße 1, 10115 Berlin,
        E-Mail: datenschutz@founder-community.example.
      </p>

      <h2>Verarbeitete Daten</h2>
      <p>
        Wir verarbeiten Daten, die Nutzer im Rahmen von Registrierung, Verifikation, Profilpflege, Event-Anmeldung,
        Mentor-Buchung und Kontaktaufnahme bereitstellen. Dazu können Name, E-Mail-Adresse, Unternehmensdaten,
        Verifikationsdokumente, technische Nutzungsdaten und Zahlungsinformationen gehören.
      </p>

      <h2>Zwecke und Rechtsgrundlagen</h2>
      <p>
        Die Verarbeitung erfolgt zur Bereitstellung der Plattform, zur Durchführung
        der Community, zur Kommunikation, zur Sicherheit der Plattform und zur Erfüllung gesetzlicher
        Pflichten. Rechtsgrundlagen sind insbesondere Art. 6 Abs. 1 lit. b, lit. c und lit. f DSGVO sowie bei
        Einwilligungen Art. 6 Abs. 1 lit. a DSGVO.
      </p>

      <h2>Speicherdauer</h2>
      <p>
        Personenbezogene Daten werden nur so lange gespeichert, wie es für die genannten Zwecke erforderlich ist oder
        gesetzliche Aufbewahrungspflichten bestehen. Verifikationsdokumente werden nach Wegfall des
        Verarbeitungszwecks gelöscht oder gesperrt, soweit keine gesetzlichen Pflichten entgegenstehen.
      </p>

      <h2>Auftragsverarbeiter und Drittanbieter</h2>
      <p>
        Für Authentifizierung, Hosting, Speicher, E-Mail-Versand, Zahlungen und Analyse können Dienstleister eingesetzt
        werden. Vor dem Live-Betrieb müssen alle Anbieter, Auftragsverarbeitungsverträge und etwaige Drittlandtransfers
        konkret dokumentiert werden.
      </p>

      <h2>Betroffenenrechte</h2>
      <p>
        Nutzer haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
        Datenübertragbarkeit sowie Widerspruch gegen bestimmte Verarbeitungen. Zudem besteht ein Beschwerderecht bei
        einer zuständigen Datenschutzaufsichtsbehörde.
      </p>

      <h2>Kontakt zum Datenschutz</h2>
      <p>Für Datenschutzanfragen genügt eine E-Mail an datenschutz@founder-community.example.</p>
    </LegalPage>
  );
}
