import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "Impressum | Founder",
};

export default function ImpressumPage() {
  return (
    <LegalPage eyebrow="Rechtliches" title="Impressum">
      <h2>Angaben gemäß §5 TMG</h2>
      <p>
        Founder<br />
        Musterstraße 1<br />
        10115 Berlin<br />
        Deutschland
      </p>

      <h2>Verantwortlicher</h2>
      <p>
        Verantwortlich für den Inhalt dieser Website ist:<br />
        Max Mustermann<br />
        Musterstraße 1<br />
        10115 Berlin
      </p>

      <h2>Kontakt</h2>
      <p>
        E-Mail: kontakt@founder-community.example<br />
        Telefon: +49 30 00000000
      </p>

      <h2>EU-Streitschlichtung</h2>
      <p>
        Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung bereit:
        https://ec.europa.eu/consumers/odr/. Wir sind nicht verpflichtet und nicht bereit, an einem
        Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
      </p>

      <h2>Haftungsausschluss</h2>
      <p>
        Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. Für den
        Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich. Die Inhalte dieser Website
        werden mit größtmöglicher Sorgfalt erstellt, eine Gewähr für Richtigkeit, Vollständigkeit und Aktualität kann
        jedoch nicht übernommen werden.
      </p>
    </LegalPage>
  );
}
