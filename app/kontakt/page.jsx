import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "Kontakt | Founder",
};

export default function KontaktPage() {
  return (
    <LegalPage eyebrow="Kontakt" title="Kontakt">
      <p>
        Du erreichst Founder über die folgenden Kontaktwege. Die Angaben sind Platzhalter und müssen vor
        dem Livegang durch echte Unternehmensdaten ersetzt werden.
      </p>

      <h2>Allgemeine Anfragen</h2>
      <p>
        E-Mail: kontakt@founder-community.example<br />
        Antwortzeit: in der Regel innerhalb von 2 Werktagen
      </p>

      <h2>Verifikation</h2>
      <p>
        Für Fragen zum Dokumenten-Upload, Rangstatus oder zur erneuten Verifikation schreibe bitte an
        verification@founder-community.example.
      </p>

      <h2>Datenschutz</h2>
      <p>Datenschutzanfragen richtest du bitte an datenschutz@founder-community.example.</p>

      <h2>Postanschrift</h2>
      <p>
        Founder<br />
        Musterstraße 1<br />
        10115 Berlin<br />
        Deutschland
      </p>
    </LegalPage>
  );
}
