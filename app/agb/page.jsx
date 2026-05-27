import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "AGB | Founder",
};

export default function AgbPage() {
  return (
    <LegalPage eyebrow="Nutzungsbedingungen" title="Allgemeine Geschäftsbedingungen">
      <p>
        Diese Allgemeinen Geschäftsbedingungen sind Platzhalter und müssen vor dem produktiven Einsatz rechtlich geprüft
        und an das finale Geschäftsmodell von Founder angepasst werden.
      </p>

      <h2>1. Geltungsbereich</h2>
      <p>
        Diese Bedingungen gelten für die Nutzung von Founder, einschließlich Registrierung, Verifikation, Community,
        Events, Mentoren, Ressourcen, Zahlungen und optionalen Zusatzleistungen.
      </p>

      <h2>2. Registrierung und Buchung</h2>
      <p>
        Nutzer müssen wahrheitsgemäße Angaben machen und sicherstellen, dass Verifikationsdaten und Profildaten korrekt
        sind.
      </p>

      <h2>3. Leistungsumfang</h2>
      <p>
        Community-Zugang, Founder Pro, Events, Mentoren und Ressourcen ergeben sich aus den jeweiligen Seiten und
        Produktbeschreibungen.
      </p>

      <h2>4. Zahlungen und Lieferung</h2>
      <p>
        Kostenpflichtige Events, Mentor-Buchungen und Founder Pro werden über Stripe bezahlt. Zugänge und Buchungen
        werden im Dashboard bereitgestellt.
      </p>

      <h2>5. Sperrung und Kündigung</h2>
      <p>
        Bei Verstößen gegen diese Bedingungen kann der Zugang eingeschränkt oder gesperrt werden. Nutzer können ihren
        Account jederzeit kündigen, soweit keine offenen Pflichten entgegenstehen.
      </p>

      <h2>6. Haftung</h2>
      <p>
        Die Plattform haftet nach den gesetzlichen Vorschriften. Für Inhalte, die Nutzer selbst veröffentlichen, sind
        diese grundsätzlich selbst verantwortlich.
      </p>
    </LegalPage>
  );
}
