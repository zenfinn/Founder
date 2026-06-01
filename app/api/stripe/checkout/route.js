import { NextResponse } from "next/server";
import { createStripeClient } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveAffiliateForCheckout } from "@/lib/referrals";
import { sanitizeStripeErrorMessage } from "@/lib/stripe-errors";
import { FOUNDER_PRO_STRIPE_PRODUCT_ID, resolveFounderProCheckoutPriceId } from "@/lib/stripe-founder-pro";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  getMentorMonthlyRateCents,
  getMentorSessionAvailability,
  getMentorSessionPriceCents,
  getMentorSessionsPerMonth,
} from "@/lib/mentors";

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function asPositiveInteger(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : 0;
}

export async function POST(request) {
  try {
    const stripe = createStripeClient();
    const supabase = createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Bitte logge dich ein, um den Checkout zu starten." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const type = body.type ?? "founder_pro";
    const appUrl = getAppUrl();

    if (type === "event_ticket") {
      const amountCents = asPositiveInteger(body.amount_cents);
      const eventKey = String(body.event_id ?? "").trim();
      const title = String(body.title ?? "Founder Event").trim();
      const cancelPath = body.cancel_path ?? "/events";

      if (!eventKey) {
        return NextResponse.json({ error: "Event-ID fehlt." }, { status: 400 });
      }

      const { data: existingTicket } = await adminSupabase
        .from("event_tickets")
        .select("id")
        .eq("event_key", eventKey)
        .eq("user_id", user.id)
        .maybeSingle();

      const ticketPayload = {
        event_key: eventKey,
        event_title: title,
        user_id: user.id,
        amount_cents: amountCents,
        status: amountCents > 0 ? "pending" : "free",
      };

      const { data: ticket, error: ticketError } = existingTicket
        ? await adminSupabase.from("event_tickets").update(ticketPayload).eq("id", existingTicket.id).select("id").single()
        : await adminSupabase.from("event_tickets").insert(ticketPayload).select("id").single();

      if (ticketError) {
        return NextResponse.json({ error: ticketError.message }, { status: 500 });
      }

      if (amountCents === 0) {
        await adminSupabase.from("notifications").insert({
          user_id: user.id,
          type: "event_reminder",
          title: "Event-Buchung bestätigt",
          body: `Dein Platz für "${title}" ist bestätigt.`,
          link_url: "/events",
        });

        return NextResponse.json({ url: `${appUrl}/payment/success?type=event_ticket&title=${encodeURIComponent(title)}` });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}${cancelPath}`,
        customer_email: user.email,
        line_items: [
          {
            price_data: {
              currency: "eur",
              unit_amount: amountCents,
              product_data: { name: title },
            },
            quantity: 1,
          },
        ],
        metadata: {
          type: "event_ticket",
          userId: user.id,
          recordId: ticket.id,
          eventId: eventKey,
          title,
        },
      });

      return NextResponse.json({ url: session.url });
    }

    if (type === "mentor_booking") {
      const mentorKey = String(body.mentor_id ?? "").trim();
      const title = String(body.title ?? "Mentor Session").trim();
      const startsAt = body.starts_at ? new Date(body.starts_at).toISOString() : null;
      const cancelPath = body.cancel_path ?? "/mentoren";

      if (!mentorKey) {
        return NextResponse.json({ error: "Mentor-ID fehlt." }, { status: 400 });
      }

      const { data: mentor, error: mentorError } = await adminSupabase
        .from("mentors")
        .select("id,name,monthly_rate_cents,hourly_rate_cents,sessions_per_month,is_approved")
        .eq("id", mentorKey)
        .maybeSingle();

      if (mentorError || !mentor?.id || !mentor.is_approved) {
        return NextResponse.json({ error: "Mentor nicht gefunden oder nicht freigeschaltet." }, { status: 404 });
      }

      const availability = await getMentorSessionAvailability(adminSupabase, mentor);
      if (availability.isSoldOut) {
        return NextResponse.json(
          { error: "Dieser Mentor hat für diesen Monat keine Sessions mehr frei." },
          { status: 409 }
        );
      }

      const amountCents = getMentorSessionPriceCents(mentor);
      if (amountCents <= 0) {
        return NextResponse.json({ error: "Ungültiger Mentor-Preis." }, { status: 400 });
      }

      const clientAmount = asPositiveInteger(body.amount_cents);
      if (clientAmount > 0 && clientAmount !== amountCents) {
        return NextResponse.json({ error: "Der Session-Preis stimmt nicht mit dem Mentor-Angebot überein." }, { status: 400 });
      }

      const sessionsPerMonth = getMentorSessionsPerMonth(mentor);
      const monthlyRateCents = getMentorMonthlyRateCents(mentor);
      const platformFeeCents = Math.round(amountCents * 0.15);
      const { data: booking, error: bookingError } = await adminSupabase
        .from("mentor_bookings")
        .insert({
          mentor_id: mentor.id,
          mentor_key: mentorKey,
          mentor_name: title,
          user_id: user.id,
          starts_at: startsAt,
          amount_cents: amountCents,
          platform_fee_cents: platformFeeCents,
          status: "pending",
        })
        .select("id")
        .single();

      if (bookingError) {
        return NextResponse.json({ error: bookingError.message }, { status: 500 });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}${cancelPath}`,
        customer_email: user.email,
        line_items: [
          {
            price_data: {
              currency: "eur",
              unit_amount: amountCents,
              product_data: {
                name: `Mentor Session: ${title}`,
                description: `${new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(monthlyRateCents / 100)}/Monat · ${sessionsPerMonth} Sessions`,
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          type: "mentor_booking",
          userId: user.id,
          recordId: booking.id,
          mentorId: mentorKey,
          title,
        },
      });

      return NextResponse.json({ url: session.url });
    }

    const founderProPriceOrProduct =
      body.stripe_price_or_product_id ?? body.stripe_product_id ?? FOUNDER_PRO_STRIPE_PRODUCT_ID;
    const founderProPrice = await resolveFounderProCheckoutPriceId(stripe, founderProPriceOrProduct);
    const onboardingCouponId = process.env.STRIPE_FOUNDER_PRO_ONBOARDING_COUPON_ID?.trim();
    const wantsOnboardingDiscount = body.onboarding_discount === true;

    if (wantsOnboardingDiscount && !onboardingCouponId) {
      return NextResponse.json(
        { error: "Der Onboarding-Rabatt ist noch nicht konfiguriert. Bitte STRIPE_FOUNDER_PRO_ONBOARDING_COUPON_ID setzen." },
        { status: 503 }
      );
    }

    const applyOnboardingDiscount = wantsOnboardingDiscount && Boolean(onboardingCouponId);

    const referralCode = String(body.referral_code ?? "").trim();
    const affiliate = await resolveAffiliateForCheckout(adminSupabase, {
      userId: user.id,
      referralCode: referralCode || undefined,
    });

    const sessionPayload = {
      mode: "subscription",
      success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}${body.cancel_path ?? "/payment/cancel"}`,
      line_items: [{ price: founderProPrice, quantity: 1 }],
      customer_email: user.email,
      metadata: {
        type: "founder_pro",
        userId: user.id,
        onboarding_discount: applyOnboardingDiscount ? "true" : "false",
        affiliateId: affiliate?.id ?? "",
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          affiliateId: affiliate?.id ?? "",
        },
      },
    };

    if (applyOnboardingDiscount) {
      sessionPayload.discounts = [{ coupon: onboardingCouponId }];
    }

    const session = await stripe.checkout.sessions.create(sessionPayload);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error", error);
    return NextResponse.json({ error: sanitizeStripeErrorMessage(error) }, { status: 500 });
  }
}
