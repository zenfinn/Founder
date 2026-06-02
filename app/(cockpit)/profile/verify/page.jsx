import { CockpitPage, CockpitPanel } from "@/components/cockpit/CockpitPage";
import { VerificationForm } from "@/components/VerificationForm";
import { ranks } from "@/lib/founder-data";

const documentsByRank = {
  starter: ["Gewerbeanmeldung"],
  builder: ["Gewerbeanmeldung", "Letzte BWA oder Steuerbescheid"],
  scaler: ["Handelsregisterauszug", "BWA"],
  elite: ["Handelsregisterauszug", "Letzter Jahresabschluss"],
};

export default function VerifyPage() {
  return (
    <CockpitPage
      eyebrow="Verifikation"
      title="Rang bestätigen lassen"
      description="Lade die benötigten Dokumente hoch. Admins prüfen die Einreichung manuell und weisen danach deinen verifizierten Rang zu."
    >
      <CockpitPanel>
        <VerificationForm />
      </CockpitPanel>

      <div className="space-y-4">
        {ranks
          .filter((rank) => rank.id !== "aspiring")
          .map((rank) => (
            <CockpitPanel key={rank.id}>
              <div className={`h-2 w-14 rounded-full ${rank.accent}`} />
              <h2 className="mt-4 font-serif text-2xl font-bold text-white">{rank.label}</h2>
              <p className="mt-2 text-sm text-neutral-400">{rank.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {documentsByRank[rank.id].map((document) => (
                  <span key={document} className="rounded-full border border-[#1a3aad]/30 px-3 py-2 text-xs font-bold text-neutral-300">
                    {document}
                  </span>
                ))}
              </div>
            </CockpitPanel>
          ))}
      </div>
    </CockpitPage>
  );
}
