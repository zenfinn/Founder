import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata("impressum");

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-[#001220] text-white p-8 md:p-16 max-w-4xl mx-auto font-sans leading-relaxed">
      <span className="text-blue-500 font-bold uppercase tracking-wider text-sm">Rechtliches</span>
      <h1 className="text-4xl font-bold mt-2 mb-8">Impressum</h1>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Angaben gemäß § 5 TMG:</h2>
        <p>Zndr Supply</p>
        <p>Finn Zender</p>
        <p>Im Mühlenfeld 15</p>
        <p>66687 Wadern</p>
        <p>Germany</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Kontakt:</h2>
        <p>Telefon: +49 15903170942</p>
        <p>E-Mail: joinfounder@gmail.com</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Umsatzsteuer-ID:</h2>
        <p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:</p>
        <p className="font-mono mt-1">DE 455912109</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">EU-Streitschlichtung:</h2>
        <p>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
          <a
            href="https://ec.europa.eu/consumers/odr/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline"
          >
            https://ec.europa.eu/consumers/odr/
          </a>
          .
        </p>
        <p>Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Verbraucherstreitbeilegung/Universalschlichtungsstelle:</h2>
        <p>
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
          teilzunehmen.
        </p>
      </section>
    </div>
  );
}
