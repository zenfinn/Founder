export const WAITLIST_MAX = 100;
export const WAITLIST_SEED_COUNT = 23;

export function getWaitlistTotal(realSignupCount = 0) {
  return Math.min(WAITLIST_MAX, WAITLIST_SEED_COUNT + Math.max(0, realSignupCount));
}

export function getWaitlistProgress(total = 0) {
  return Math.min(100, Math.round((total / WAITLIST_MAX) * 100));
}

export function isValidWaitlistEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? "").trim());
}
