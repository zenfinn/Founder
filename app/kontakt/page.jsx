import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata("kontakt");

export default function KontaktPage() {
  return (
    <div className="min-h-screen bg-[#001220] text-white p-8 md:p-16 max-w-4xl mx-auto font-sans leading-relaxed">
      <span className="text-blue-500 font-bold uppercase tracking-wider text-sm">Support</span>
      <h1 className="text-4xl font-bold mt-2 mb-8">Kontakt</h1>

      <p className="mb-6 text-lg">
        Haben Sie Fragen, Anregungen oder benötigen Support? Unser Team ist gerne für Sie da. Wir antworten in der Regel
        innerhalb kürzester Zeit.
      </p>

      <section className="mb-6 bg-[#001e36] p-6 rounded-lg border border-blue-900/50">
        <h2 className="text-xl font-semibold mb-4">Unternehmenssitz:</h2>
        <p>Zndr Supply</p>
        <p>Im Mühlenfeld 15</p>
        <p>66687 Wadern</p>
        <p>Germany</p>
      </section>

      <section className="mb-6 bg-[#001e36] p-6 rounded-lg border border-blue-900/50">
        <h2 className="text-xl font-semibold mb-4">Direkte Erreichbarkeit:</h2>
        <p className="mb-2">
          <strong>E-Mail:</strong>{" "}
          <a href="mailto:joinfounder@gmail.com" className="text-blue-400 underline">
            joinfounder@gmail.com
          </a>
        </p>
        <p>
          <strong>Telefon:</strong> +49 15903170942 (Montag – Freitag)
        </p>
      </section>
    </div>
  );
}
