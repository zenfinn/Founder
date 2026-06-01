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
      "Als Mentor bewerben (max. 50€/Monat)",
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
      "Als Mentor anbieten (max. 150€/Monat)",
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
      "Als Mentor anbieten (max. 500€/Monat)",
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

export function getMentorMonthlyRateCap(rank = "aspiring") {
  return mentorRateCaps[rank] ?? null;
}

/** @deprecated Use getMentorMonthlyRateCap */
export function getMentorHourlyRateCap(rank = "aspiring") {
  return getMentorMonthlyRateCap(rank);
}

export function canOfferMentoring(rank = "aspiring") {
  return getMentorMonthlyRateCap(rank) !== null;
}

export function validateMentorMonthlyRate(rank, monthlyEur) {
  const cap = getMentorMonthlyRateCap(rank);

  if (cap === null) {
    return {
      ok: false,
      message: "Ab Builder kannst du als Mentor auftreten. Verifiziere zuerst deinen Rang.",
    };
  }

  const rate = Number(monthlyEur);
  if (!Number.isFinite(rate) || rate <= 0) {
    return { ok: false, message: "Bitte gib einen gültigen Monatspreis ein." };
  }

  if (rate > cap) {
    return { ok: false, message: `Dein Rang erlaubt maximal ${cap}€/Monat.` };
  }

  return { ok: true, cap };
}

/** @deprecated Use validateMentorMonthlyRate */
export function validateMentorHourlyRate(rank, hourlyEur) {
  return validateMentorMonthlyRate(rank, hourlyEur);
}

export function clampMentorMonthlyRate(rank, monthlyEur) {
  const cap = getMentorMonthlyRateCap(rank);
  const rate = Number(monthlyEur);
  if (cap === null || !Number.isFinite(rate)) return rate;
  return Math.min(rate, cap);
}

/** @deprecated Use clampMentorMonthlyRate */
export function clampMentorHourlyRate(rank, hourlyEur) {
  return clampMentorMonthlyRate(rank, hourlyEur);
}
