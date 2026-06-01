const ACTIVE_BOOKING_STATUSES = ["pending", "paid", "completed"];

export function getMentorMonthlyRateCents(mentor = {}) {
  return mentor.monthly_rate_cents ?? mentor.hourly_rate_cents ?? 0;
}

export function getMentorSessionsPerMonth(mentor = {}) {
  const sessions = Number(mentor.sessions_per_month);
  return Number.isFinite(sessions) && sessions > 0 ? Math.round(sessions) : 1;
}

export function getMentorSessionPriceCents(mentor = {}) {
  const monthly = getMentorMonthlyRateCents(mentor);
  const sessions = getMentorSessionsPerMonth(mentor);
  return Math.round(monthly / sessions);
}

export function formatMentorMonthlyRate(cents = 0) {
  return (
    new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100) + "/Monat"
  );
}

export function formatMentorPricing(mentor = {}) {
  const monthly = getMentorMonthlyRateCents(mentor);
  const sessions = getMentorSessionsPerMonth(mentor);
  const sessionLabel = sessions === 1 ? "1 Session" : `${sessions} Sessions`;
  return `${formatMentorMonthlyRate(monthly)} · ${sessionLabel}`;
}

export function formatMentorSessionPrice(mentor = {}) {
  const sessionCents = getMentorSessionPriceCents(mentor);
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(sessionCents / 100);
}

export function getMonthRange(date = new Date()) {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1);
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
  const sessionsPerMonth = getMentorSessionsPerMonth(mentor);
  const booked = await countMentorBookingsThisMonth(adminSupabase, mentor.id, date);
  const remaining = Math.max(0, sessionsPerMonth - booked);

  return {
    sessionsPerMonth,
    bookedThisMonth: booked,
    remaining,
    isSoldOut: remaining <= 0,
  };
}
