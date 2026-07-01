import { NextResponse } from "next/server";
import { attachReferralToUser } from "@/lib/referrals";
import { ensureGlobalLoungeMembership } from "@/lib/dashboard-lounge";
import { sanitizeProfilePayload } from "@/lib/profiles";
import { resolveRequestedRank } from "@/lib/rank-system";
import { sendEmail } from "@/lib/email";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function mapRegisterError(message = "") {
  const text = message.toLowerCase();

  if (text.includes("already") || text.includes("registered") || text.includes("exists")) {
    return "Diese E-Mail ist bereits registriert. Bitte logge dich ein.";
  }

  if (text.includes("rate limit")) {
    return "Zu viele Versuche. Bitte warte ein paar Minuten und versuche es erneut.";
  }

  if (text.includes("password")) {
    return "Das Passwort muss mindestens 8 Zeichen lang sein.";
  }

  return message || "Registrierung fehlgeschlagen.";
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = normalizeEmail(body.email);
    const password = String(body.password ?? "");
    const name = String(body.name ?? "").trim();
    const companyName = String(body.company_name ?? body.companyName ?? "").trim();
    const industry = String(body.industry ?? "").trim();
    const estimatedAnnualRevenue = String(body.estimated_annual_revenue ?? body.estimatedAnnualRevenue ?? "").trim();
    const fallbackRank = String(body.requested_rank ?? body.requestedRank ?? "aspiring").trim() || "aspiring";
    const referralCode = String(body.referral_code ?? body.referralCode ?? "").trim();

    if (!email || !password || !name || !companyName || !industry || !estimatedAnnualRevenue) {
      return NextResponse.json({ error: "Bitte fülle alle Pflichtfelder aus." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Das Passwort muss mindestens 8 Zeichen lang sein." }, { status: 400 });
    }

    const requestedRank = resolveRequestedRank({
      revenueInput: estimatedAnnualRevenue,
      fallbackRank,
    });

    const adminSupabase = createAdminSupabaseClient();
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: name,
        company_name: companyName,
        industry,
        estimated_annual_revenue: estimatedAnnualRevenue,
        requested_rank: requestedRank,
      },
    });

    if (authError || !authData.user?.id) {
      return NextResponse.json({ error: mapRegisterError(authError?.message) }, { status: 400 });
    }

    const userId = authData.user.id;

    const { error: profileError } = await adminSupabase.from("profiles").upsert(
      {
        id: userId,
        ...sanitizeProfilePayload({
          display_name: name,
          company_name: companyName,
          industry,
          username: "",
          bio: "",
          avatar_url: "",
          instagram_url: "",
          tiktok_url: "",
          linkedin_url: "",
          website_url: "",
          twitter_url: "",
        }),
        estimated_annual_revenue: estimatedAnnualRevenue,
        requested_rank: requestedRank,
        current_rank: "aspiring",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (profileError) {
      await adminSupabase.auth.admin.deleteUser(userId).catch(() => {});
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    await ensureGlobalLoungeMembership(adminSupabase, userId);

    if (referralCode) {
      await attachReferralToUser(adminSupabase, { userId, referralCode }).catch((error) => {
        console.error("register referral attach", error);
      });
    }

    sendEmail({
      to: email,
      subject: "Willkommen bei Founder",
      text: `Willkommen bei Founder${name ? `, ${name}` : ""}. Du bist registriert — logge dich ein und starte dein persönliches Onboarding.`,
    }).catch((error) => {
      console.error("register welcome email", error);
    });

    return NextResponse.json({
      ok: true,
      userId,
      requested_rank: requestedRank,
    });
  } catch (error) {
    console.error("POST /api/auth/register", error);
    return NextResponse.json({ error: error.message ?? "Registrierung fehlgeschlagen." }, { status: 500 });
  }
}
