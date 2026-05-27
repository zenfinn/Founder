import { NextResponse } from "next/server";
import { attachReferralToUser } from "@/lib/referrals";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Bitte logge dich ein." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const referralCode = String(body.referralCode ?? "").trim();

    if (!referralCode) {
      return NextResponse.json({ error: "Referral-Code fehlt." }, { status: 400 });
    }

    const adminSupabase = createAdminSupabaseClient();
    const result = await attachReferralToUser(adminSupabase, {
      userId: user.id,
      referralCode,
    });

    if (!result.ok) {
      if (result.reason === "self_referral") {
        return NextResponse.json({ error: "Du kannst dich nicht selbst werben." }, { status: 400 });
      }
      return NextResponse.json({ error: "Referral-Code ungültig." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, alreadyAttached: result.alreadyAttached ?? false });
  } catch (error) {
    console.error("POST /api/referrals/attach", error);
    return NextResponse.json({ error: error.message ?? "Referral konnte nicht gespeichert werden." }, { status: 500 });
  }
}
