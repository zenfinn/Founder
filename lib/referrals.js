export const FOUNDER_PRO_REFERRAL_RATE = 0.1;
export const REFERRAL_STORAGE_KEY = "founder_referral_code";

export function calculateReferralCommission(revenueCents, rate = FOUNDER_PRO_REFERRAL_RATE) {
  const revenue = Number(revenueCents);
  if (!Number.isFinite(revenue) || revenue <= 0) return 0;
  return Math.round(revenue * rate);
}

export function formatEuroFromCents(cents = 0) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format((cents ?? 0) / 100);
}

export function makeReferralCode(userId) {
  return `founder-${String(userId).slice(0, 8)}`;
}

export async function getAffiliateByCode(adminSupabase, referralCode) {
  const code = String(referralCode ?? "").trim();
  if (!code) return null;

  const { data, error } = await adminSupabase
    .from("affiliates")
    .select("id,user_id,referral_code")
    .eq("referral_code", code)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function ensureAffiliateForUser(adminSupabase, userId) {
  const { data: existing, error: readError } = await adminSupabase
    .from("affiliates")
    .select("id,user_id,referral_code")
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) throw readError;
  if (existing) return existing;

  const referralCode = makeReferralCode(userId);
  const { data, error } = await adminSupabase
    .from("affiliates")
    .insert({ user_id: userId, referral_code: referralCode })
    .select("id,user_id,referral_code")
    .single();

  if (error) throw error;
  return data;
}

export async function attachReferralToUser(adminSupabase, { userId, referralCode }) {
  const affiliate = await getAffiliateByCode(adminSupabase, referralCode);
  if (!affiliate) {
    return { ok: false, reason: "invalid_code" };
  }

  if (affiliate.user_id === userId) {
    return { ok: false, reason: "self_referral" };
  }

  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("referred_by_affiliate_id")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.referred_by_affiliate_id) {
    return { ok: true, affiliate, alreadyAttached: true };
  }

  const { error: profileError } = await adminSupabase
    .from("profiles")
    .update({ referred_by_affiliate_id: affiliate.id, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (profileError) throw profileError;

  const { data: existingReferral } = await adminSupabase
    .from("referrals")
    .select("id")
    .eq("affiliate_id", affiliate.id)
    .eq("referred_user_id", userId)
    .maybeSingle();

  if (existingReferral?.id) {
    await adminSupabase.from("referrals").update({ status: "registered" }).eq("id", existingReferral.id);
  } else {
    const { error: referralError } = await adminSupabase.from("referrals").insert({
      affiliate_id: affiliate.id,
      referred_user_id: userId,
      status: "registered",
      commission_rate: FOUNDER_PRO_REFERRAL_RATE,
      commission_months: 999,
      commission_cents: 0,
    });

    if (referralError) throw referralError;
  }

  return { ok: true, affiliate, alreadyAttached: false };
}

export async function resolveAffiliateForCheckout(adminSupabase, { userId, referralCode }) {
  if (referralCode) {
    const attached = await attachReferralToUser(adminSupabase, { userId, referralCode });
    if (attached.ok && attached.affiliate) {
      return attached.affiliate;
    }
  }

  const { data: profile, error } = await adminSupabase
    .from("profiles")
    .select("referred_by_affiliate_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!profile?.referred_by_affiliate_id) return null;

  const { data: affiliate, error: affiliateError } = await adminSupabase
    .from("affiliates")
    .select("id,user_id,referral_code")
    .eq("id", profile.referred_by_affiliate_id)
    .maybeSingle();

  if (affiliateError) throw affiliateError;
  return affiliate;
}

export async function recordFounderProCommission(adminSupabase, {
  affiliateId,
  referredUserId,
  revenueCents,
  stripeInvoiceId = null,
  stripeCheckoutSessionId = null,
}) {
  if (!affiliateId || !referredUserId) return null;

  const commissionCents = calculateReferralCommission(revenueCents);
  if (commissionCents <= 0) return null;

  const payload = {
    affiliate_id: affiliateId,
    referred_user_id: referredUserId,
    revenue_cents: revenueCents,
    commission_cents: commissionCents,
    commission_rate: FOUNDER_PRO_REFERRAL_RATE,
    product_type: "founder_pro",
    stripe_invoice_id: stripeInvoiceId,
    stripe_checkout_session_id: stripeCheckoutSessionId,
  };

  const { data, error } = await adminSupabase
    .from("referral_commissions")
    .insert(payload)
    .select("id,commission_cents")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") return null;
    throw error;
  }

  await adminSupabase
    .from("referrals")
    .update({
      status: "paid",
      commission_cents: commissionCents,
      commission_rate: FOUNDER_PRO_REFERRAL_RATE,
    })
    .eq("affiliate_id", affiliateId)
    .eq("referred_user_id", referredUserId);

  const { data: affiliate } = await adminSupabase
    .from("affiliates")
    .select("user_id")
    .eq("id", affiliateId)
    .maybeSingle();

  if (affiliate?.user_id) {
    await adminSupabase.from("notifications").insert({
      user_id: affiliate.user_id,
      type: "referral",
      title: "Founder Pro Provision",
      body: `Du hast ${formatEuroFromCents(commissionCents)} Provision (${Math.round(FOUNDER_PRO_REFERRAL_RATE * 100)}% vom Umsatz) erhalten.`,
      link_url: "/affiliate",
    });
  }

  return data;
}
