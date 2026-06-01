const ACTIVE_BOOKING_STATUSES = ["pending", "paid", "completed"];
const BERLIN_TZ = "Europe/Berlin";

export function getMentorMonthlyRateCents(mentor = {}) {
  const monthly = Number(mentor.monthly_rate_cents);
  if (Number.isFinite(monthly) && monthly > 0) {
    return Math.round(monthly);
  }

  const legacyHourly = Number(mentor.hourly_rate_cents);
  return Number.isFinite(legacyHourly) && legacyHourly > 0 ? Math.round(legacyHourly) : 0;
}

export function getMentorSessionsPerMonth(mentor = {}) {
  const sessions = Number(mentor.sessions_per_month);
  return Number.isFinite(sessions) && sessions > 0 ? Math.round(sessions) : 1;
}

export function resolveMentorPricing(mentor = {}) {
  const monthlyRateCents = getMentorMonthlyRateCents(mentor);
  const sessionsPerMonth = getMentorSessionsPerMonth(mentor);
  const sessionPriceCents =
    monthlyRateCents > 0 && sessionsPerMonth > 0 ? Math.round(monthlyRateCents / sessionsPerMonth) : 0;

  return {
    monthlyRateCents,
    sessionsPerMonth,
    sessionPriceCents,
  };
}

export function getMentorSessionPriceCents(mentor = {}) {
  return resolveMentorPricing(mentor).sessionPriceCents;
}

export function formatMentorMonthlyRate(cents = 0) {
  return (
    new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100) + "/Monat"
  );
}

export function formatMentorPricing(mentor = {}) {
  const { monthlyRateCents, sessionsPerMonth } = resolveMentorPricing(mentor);
  const sessionLabel = sessionsPerMonth === 1 ? "1 Session" : `${sessionsPerMonth} Sessions`;
  return `${formatMentorMonthlyRate(monthlyRateCents)} · ${sessionLabel}`;
}

export function formatMentorSessionPrice(mentor = {}) {
  const sessionCents = getMentorSessionPriceCents(mentor);
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(sessionCents / 100);
}

function getBerlinCalendarParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BERLIN_TZ,
    year: "numeric",
    month: "numeric",
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
  };
}

function berlinMidnightUtc(year, month) {
  const targetDay = `${year}-${String(month).padStart(2, "0")}-01`;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: BERLIN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  let start = Date.UTC(year, month - 1, 1) - 6 * 3600000;
  let end = Date.UTC(year, month - 1, 1) + 6 * 3600000;

  while (start < end) {
    const mid = Math.floor((start + end) / 2);
    const berlinDate = formatter.format(new Date(mid));

    if (berlinDate < targetDay) {
      start = mid + 1;
    } else {
      end = mid;
    }
  }

  return new Date(start);
}

export function getMonthRange(date = new Date()) {
  const { year, month } = getBerlinCalendarParts(date);
  const monthStart = berlinMidnightUtc(year, month);
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const monthEnd = berlinMidnightUtc(nextMonth.year, nextMonth.month);

  return {
    monthStart: monthStart.toISOString(),
    monthEnd: monthEnd.toISOString(),
  };
}

export function validateMentorSessionsPerMonth(value) {
  const sessions = Number(value);
  if (!Number.isInteger(sessions) || sessions < 1 || sessions > 31) {
    return { ok: false, message: "Bitte gib zwischen 1 und 31 Sessions pro Monat an." };
  }
  return { ok: true, value: sessions };
}

export async function countMentorBookingsThisMonth(adminSupabase, mentorId, date = new Date()) {
  const { monthStart, monthEnd } = getMonthRange(date);
  const { count, error } = await adminSupabase
    .from("mentor_bookings")
    .select("id", { count: "exact", head: true })
    .or(`mentor_key.eq.${mentorId},mentor_id.eq.${mentorId}`)
    .in("status", ACTIVE_BOOKING_STATUSES)
    .gte("created_at", monthStart)
    .lt("created_at", monthEnd);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function getMentorSessionAvailability(adminSupabase, mentor, date = new Date()) {
  const { sessionsPerMonth } = resolveMentorPricing(mentor);
  const booked = await countMentorBookingsThisMonth(adminSupabase, mentor.id, date);
  const remaining = Math.max(0, sessionsPerMonth - booked);

  return {
    sessionsPerMonth,
    bookedThisMonth: booked,
    remaining,
    isSoldOut: remaining <= 0,
  };
}
