import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "Impressum | Founder",
  description: "Impressum von Zndr Supply – Finn Zender.",
};

export default function ImpressumPage() {
  return (
    <LegalPage eyebrow="Rechtliches" title="Impressum">
      <section>
        <h2 className="font-serif text-2xl font-bold text-white">Angaben gemäß § 5 TMG:</h2>
        <p className="mt-3">
          Zndr Supply
          <br />
          Finn Zender
          <br />
          Im Mühlenfeld 15
          <br />
          66687 Wadern
          <br />
          Germany
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl font-bold text-white">Kontakt:</h2>
        <p className="mt-3">
          Telefon:{" "}
          <a href="tel:+4915903170942" className="text-founder-200 underline underline-offset-2 hover:text-white">
            +49 15903170942
          </a>
          <br />
          E-Mail:{" "}
          <a href="mailto:zndr.supply@gmail.com" className="text-founder-200 underline underline-offset-2 hover:text-white">
            zndr.supply@gmail.com
          </a>
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl font-bold text-white">Umsatzsteuer-ID:</h2>
        <p className="mt-3">
          Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:
          <br />
          DE 455912109
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl font-bold text-white">EU-Streitschlichtung:</h2>
        <p className="mt-3">
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
          <a
            href="https://ec.europa.eu/consumers/odr/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-founder-200 underline underline-offset-2 hover:text-white"
          >
            https://ec.europa.eu/consumers/odr/
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl font-bold text-white">Verbraucherstreitbeilegung/Universalschlichtungsstelle:</h2>
        <p className="mt-3">
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
          teilzunehmen.
        </p>
      </section>
    </LegalPage>
  );
}
