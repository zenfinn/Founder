import { NextResponse } from "next/server";
import { createStripeClient } from "@/lib/stripe";
import { getStripeWebhookSecret } from "@/lib/stripe-env";
import { recordFounderProCommission } from "@/lib/referrals";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

async function resolveAffiliateIdForPayment(adminSupabase, { userId, affiliateIdFromMetadata }) {
  if (affiliateIdFromMetadata) return affiliateIdFromMetadata;

  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("referred_by_affiliate_id")
    .eq("id", userId)
    .maybeSingle();

  return profile?.referred_by_affiliate_id ?? null;
}

async function handleFounderProInvoicePayment(stripe, adminSupabase, invoice) {
  const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  const affiliateId = await resolveAffiliateIdForPayment(adminSupabase, {
    userId,
    affiliateIdFromMetadata: subscription.metadata?.affiliateId || null,
  });

  if (!affiliateId) return;

  const revenueCents = Number(invoice.amount_paid ?? 0);
  if (revenueCents <= 0) return;

  await recordFounderProCommission(adminSupabase, {
    affiliateId,
    referredUserId: userId,
    revenueCents,
    stripeInvoiceId: invoice.id,
  });
}

export async function POST(request) {
  const stripe = createStripeClient();
  const supabase = createAdminSupabaseClient();
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  let webhookSecret;
  try {
    webhookSecret = getStripeWebhookSecret();
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!signature) {
    return NextResponse.json({ error: "Stripe Signature fehlt." }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const metadata = session.metadata ?? {};
    const userId = metadata.userId;
    const checkoutType = metadata.type ?? "founder_pro";

    if (!userId) {
      return NextResponse.json({ error: "Stripe Session ohne metadata.userId." }, { status: 400 });
    }

    if (checkoutType === "event_ticket") {
      const { error } = await supabase
        .from("event_tickets")
        .update({
          status: "paid",
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
        })
        .eq("id", metadata.recordId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      await supabase.from("notifications").insert({
        user_id: userId,
        type: "event_reminder",
        title: "Ticket bestätigt",
        body: `Dein Ticket für "${metadata.title ?? "das Event"}" wurde bezahlt und bestätigt.`,
        link_url: "/events",
      });

      if (session.customer_details?.email) {
        await sendEmail({
          to: session.customer_details.email,
          subject: "Dein Founder Event-Ticket",
          text: `Dein Ticket für "${metadata.title ?? "das Event"}" wurde bestätigt.`,
        });
      }
    } else if (checkoutType === "mentor_booking") {
      const { error } = await supabase
        .from("mentor_bookings")
        .update({
          status: "paid",
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
        })
        .eq("id", metadata.recordId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      await supabase.from("notifications").insert({
        user_id: userId,
        type: "mentor_booking",
        title: "Mentor-Buchung bestätigt",
        body: `Deine Session mit ${metadata.title ?? "dem Mentor"} wurde bezahlt und bestätigt.`,
        link_url: "/mentoren",
      });

      if (session.customer_details?.email) {
        await sendEmail({
          to: session.customer_details.email,
          subject: "Deine Founder Mentor-Buchung",
          text: `Deine Mentor-Session mit ${metadata.title ?? "dem Mentor"} wurde bestätigt.`,
        });
      }
    } else {
      const { error } = await supabase
        .from("profiles")
        .update({
          founder_pro: true,
          founder_pro_since: new Date().toISOString(),
          plan: "pro",
          stripe_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object;
    if (invoice.amount_paid > 0) {
      try {
        await handleFounderProInvoicePayment(stripe, supabase, invoice);
      } catch (error) {
        console.error("Founder Pro referral commission error", error);
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
    const userId = subscription.metadata?.userId;

    const query = supabase
      .from("profiles")
      .update({
        founder_pro: false,
        updated_at: new Date().toISOString(),
      });

    const { error } = userId ? await query.eq("id", userId) : await query.eq("stripe_customer_id", customerId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
