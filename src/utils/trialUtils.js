import { addDays, differenceInCalendarDays, isValid, parseISO } from "date-fns";

const TRIAL_LENGTH_DAYS = 30;

/**
 * @param {string | Date | null | undefined} trialStartedAt
 * @returns {boolean}
 */
export function isTrialActive(trialStartedAt) {
  if (!trialStartedAt) return false;
  const start = typeof trialStartedAt === "string" ? parseISO(trialStartedAt) : trialStartedAt;
  if (!isValid(start)) return false;
  const trialEnd = addDays(start, TRIAL_LENGTH_DAYS);
  return differenceInCalendarDays(trialEnd, new Date()) >= 0;
}

/**
 * @param {string | Date | null | undefined} trialStartedAt
 * @returns {number | null} verbleibende Kalendertage bis Trial-Ende (0 am letzten Tag), null wenn kein gültiges Datum
 */
export function getTrialDaysRemaining(trialStartedAt) {
  if (!trialStartedAt) return null;
  const start = typeof trialStartedAt === "string" ? parseISO(trialStartedAt) : trialStartedAt;
  if (!isValid(start)) return null;
  const trialEnd = addDays(start, TRIAL_LENGTH_DAYS);
  return Math.max(0, differenceInCalendarDays(trialEnd, new Date()));
}
