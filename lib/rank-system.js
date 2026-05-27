export const rankTiers = [
  {
    id: "aspiring",
    label: "Aspiring",
    accent: "bg-rank-aspiring",
    ring: "ring-slate-200",
    criteria: "Einfach registrieren",
    benefits: [
      "Events: Kalender & Details ansehen",
      "Ressourcen-Bibliothek durchstöbern",
      "Haupt-Community (Lese-Rechte)",
    ],
    upload: "Nur E-Mail bestätigen",
    mentorCap: null,
  },
  {
    id: "starter",
    label: "Starter",
    accent: "bg-rank-starter",
    ring: "ring-blue-200",
    criteria: "Aktives Gewerbe",
    benefits: [
      "Alle Aspiring-Vorteile",
      "Eigener Referral-Link (10% Provision)",
      "Schreiben in Branchen-Channels",
      "Kostenlose Events buchen",
    ],
    upload: "Gewerbeanmeldung",
    mentorCap: null,
  },
  {
    id: "builder",
    label: "Builder",
    accent: "bg-rank-builder",
    ring: "ring-emerald-200",
    criteria: "50k–250k EUR Umsatz/Jahr",
    benefits: [
      "Alle Starter-Vorteile",
      "Mentoren buchen",
      "Bezahlte Events & Workshops",
      "Ressourcen posten & teilen",
      "Als Mentor bewerben (max. 50€/h)",
    ],
    upload: "Kontoauszug oder Steuerbescheid",
    mentorCap: 50,
  },
  {
    id: "scaler",
    label: "Scaler",
    accent: "bg-rank-scaler",
    ring: "ring-amber-200",
    criteria: "250k–1M EUR Umsatz/Jahr",
    benefits: [
      "Alle Builder-Vorteile",
      "Premium Channels",
      "Deal-Board",
      "Als Mentor anbieten (max. 150€/h)",
    ],
    upload: "BWA oder Steuerbescheid",
    mentorCap: 150,
  },
  {
    id: "elite",
    label: "Elite",
    accent: "bg-rank-elite",
    ring: "ring-fuchsia-200",
    criteria: "Über 1M EUR Umsatz/Jahr",
    benefits: [
      "Alle Scaler-Vorteile",
      "VIP Events",
      "Elite Mastermind",
      "Als Mentor anbieten (max. 500€/h)",
    ],
    upload: "Jahresabschluss oder BWA",
    mentorCap: 500,
  },
];

export const verificationDocuments = {
  starter: [{ type: "business_registration", label: "Gewerbeanmeldung" }],
  builder: [{ type: "tax_assessment", label: "Letzter Kontoauszug oder Steuerbescheid mit sichtbarem Umsatz" }],
  scaler: [{ type: "bwa", label: "BWA oder Steuerbescheid" }],
  elite: [{ type: "annual_financial_statement", label: "Jahresabschluss oder BWA" }],
};

const mentorRateCaps = {
  builder: 50,
  scaler: 150,
  elite: 500,
};

export function getRankTier(rankId = "aspiring") {
  return rankTiers.find((tier) => tier.id === rankId) ?? rankTiers[0];
}

export function getMentorHourlyRateCap(rank = "aspiring") {
  return mentorRateCaps[rank] ?? null;
}

export function canOfferMentoring(rank = "aspiring") {
  return getMentorHourlyRateCap(rank) !== null;
}

export function validateMentorHourlyRate(rank, hourlyEur) {
  const cap = getMentorHourlyRateCap(rank);

  if (cap === null) {
    return {
      ok: false,
      message: "Ab Builder kannst du als Mentor auftreten. Verifiziere zuerst deinen Rang.",
    };
  }

  const rate = Number(hourlyEur);
  if (!Number.isFinite(rate) || rate <= 0) {
    return { ok: false, message: "Bitte gib einen gültigen Stundensatz ein." };
  }

  if (rate > cap) {
    return { ok: false, message: `Dein Rang erlaubt maximal ${cap}€/Stunde.` };
  }

  return { ok: true, cap };
}

export function clampMentorHourlyRate(rank, hourlyEur) {
  const cap = getMentorHourlyRateCap(rank);
  const rate = Number(hourlyEur);
  if (cap === null || !Number.isFinite(rate)) return rate;
  return Math.min(rate, cap);
}
