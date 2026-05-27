function formatAmount(amount, language) {
  const locale = language === "en" ? "en-US" : "de-DE";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(Number(amount ?? 0));
}

function normalizeLanguage(language) {
  if (language === "de" || language === "en") return language;
  if (typeof navigator !== "undefined") {
    return String(navigator.language || "").toLowerCase().startsWith("de") ? "de" : "en";
  }
  return "en";
}

/**
 * Creates a professional outreach email body for missing invoices.
 * Signature intentionally keeps vendor/amount/date as primary placeholders.
 */
export function generateOutreachEmail(vendor, amount, date, language) {
  const lang = normalizeLanguage(language);
  const safeVendor = String(vendor ?? "").trim() || (lang === "de" ? "Unbekannter Anbieter" : "Unknown vendor");
  const safeDate = String(date ?? "").trim() || (lang === "de" ? "unbekanntem Datum" : "unknown date");
  const amountText = formatAmount(amount, lang);

  if (lang === "de") {
    return [
      "Sehr geehrte Damen und Herren,",
      "",
      `ich bitte um Zusendung der Rechnung zu meiner Zahlung vom ${safeDate} in Höhe von ${amountText}.`,
      "",
      `Anbieter/Leistungserbringer: ${safeVendor}.`,
      "",
      "Bitte senden Sie mir die Rechnung inklusive ausgewiesener Umsatzsteuer als PDF an diese E-Mail-Adresse.",
      "",
      "Vielen Dank für Ihre Unterstützung.",
      "Mit freundlichen Grüßen",
      "Finanzbuchhaltung",
    ].join("\n");
  }

  return [
    "Dear Sir or Madam,",
    "",
    `I kindly request an invoice for my payment dated ${safeDate} in the amount of ${amountText}.`,
    "",
    `Vendor / reference: ${safeVendor}.`,
    "",
    "Please send the invoice, including VAT details, as a PDF to this email address.",
    "",
    "Thank you for your support.",
    "Kind regards,",
    "Finance / Accounting",
  ].join("\n");
}

