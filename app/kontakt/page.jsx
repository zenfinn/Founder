import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "Kontakt | Founder",
  description: "Kontakt zu Zndr Supply – Finn Zender.",
};

export default function KontaktPage() {
  return (
    <LegalPage eyebrow="Kontakt" title="Kontakt">
      <p>
        Haben Sie Fragen, Anregungen oder benötigen Support? Unser Team ist gerne für Sie da. Wir antworten in der
        Regel innerhalb kürzester Zeit.
      </p>

      <section>
        <h2 className="font-serif text-2xl font-bold text-white">Unternehmenssitz:</h2>
        <p className="mt-3">
          Zndr Supply
          <br />
          Im Mühlenfeld 15
          <br />
          66687 Wadern
          <br />
          Germany
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl font-bold text-white">So erreichen Sie uns:</h2>
        <p className="mt-3">
          E-Mail:{" "}
          <a href="mailto:zndr.supply@gmail.com" className="text-founder-200 underline underline-offset-2 hover:text-white">
            zndr.supply@gmail.com
          </a>
          <br />
          Telefon:{" "}
          <a href="tel:+4915903170942" className="text-founder-200 underline underline-offset-2 hover:text-white">
            +49 15903170942
          </a>{" "}
          (Montag – Freitag)
        </p>
      </section>
    </LegalPage>
  );
}
