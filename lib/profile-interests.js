export const MAX_PROFILE_BIO_LENGTH = 200;
export const MAX_PROFILE_INTERESTS = 3;

export const PROFILE_INTEREST_OPTIONS = [
  "Reselling",
  "Dropshipping",
  "E-Commerce",
  "Amazon FBA",
  "TikTok Creator",
  "TikTok Shop",
  "KI Creator",
  "YouTube Automation",
  "Digital Business",
  "Trading",
  "Memecoin Trading",
  "Mentoring",
  "Networking",
  "Events",
  "SaaS",
  "Agentur",
];

export function normalizeProfileInterests(interests = []) {
  const unique = [];
  for (const item of interests ?? []) {
    const value = String(item ?? "").trim();
    if (!value || unique.includes(value)) continue;
    unique.push(value);
    if (unique.length >= MAX_PROFILE_INTERESTS) break;
  }
  return unique;
}

export function truncateProfileBio(value = "") {
  return String(value ?? "").slice(0, MAX_PROFILE_BIO_LENGTH);
}

export function validateProfileBio(value = "") {
  if (String(value ?? "").length > MAX_PROFILE_BIO_LENGTH) {
    return `Über mich darf maximal ${MAX_PROFILE_BIO_LENGTH} Zeichen haben.`;
  }
  return null;
}

export function validateProfileInterests(interests = []) {
  const normalized = normalizeProfileInterests(interests);
  if (normalized.length > MAX_PROFILE_INTERESTS) {
    return `Maximal ${MAX_PROFILE_INTERESTS} Interessen erlaubt.`;
  }
  return null;
}
