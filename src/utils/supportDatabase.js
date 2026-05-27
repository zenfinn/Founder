/**
 * Bekannte Support-Kontakte für große Anbieter (Missing-Invoice / Outreach).
 * Keys sind normalisierte Marken-Namen (lowercase).
 */
export const SUPPORT_CONTACTS = [
  { keys: ["amazon"], email: "rechnung@amazon.de", label: "Amazon" },
  { keys: ["adobe"], email: "support@adobe.com", label: "Adobe" },
  { keys: ["google", "google ads", "youtube"], email: "payments-support@google.com", label: "Google" },
  { keys: ["microsoft", "office 365", "azure"], email: "support@microsoft.com", label: "Microsoft" },
  { keys: ["meta", "facebook", "instagram"], email: "business@meta.com", label: "Meta" },
  { keys: ["linkedin"], email: "billing@linkedin.com", label: "LinkedIn" },
  { keys: ["openai", "chatgpt"], email: "support@openai.com", label: "OpenAI" },
];

function normalizeVendor(vendor) {
  return String(vendor ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * @param {string} vendorName
 * @returns {string | null} support E-Mail oder null
 */
export function getSupportContactForVendor(vendorName) {
  const needle = normalizeVendor(vendorName);
  if (!needle) return null;
  for (const entry of SUPPORT_CONTACTS) {
    if (entry.keys.some((k) => needle.includes(k) || k.includes(needle))) {
      return entry.email;
    }
  }
  return null;
}

/**
 * Prüft Freitext (Betreff/Absender/Snippet) auf bekannte Anbieter-Marken.
 * @param {string} text
 * @returns {boolean}
 */
export function textHasKnownProvider(text) {
  const hay = normalizeVendor(text);
  if (!hay) return false;
  return SUPPORT_CONTACTS.some((entry) => entry.keys.some((k) => hay.includes(k)));
}
