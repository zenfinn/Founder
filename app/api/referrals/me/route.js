import { NextResponse } from "next/server";
import { ensureAffiliateForUser } from "@/lib/referrals";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Bitte logge dich ein." }, { status: 401 });
    }

    const adminSupabase = createAdminSupabaseClient();
    const affiliate = await ensureAffiliateForUser(adminSupabase, user.id);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    return NextResponse.json({
      referral_code: affiliate.referral_code,
      register_link: `${appUrl}/register?ref=${affiliate.referral_code}`,
      pro_link: `${appUrl}/dashboard?ref=${affiliate.referral_code}`,
    });
  } catch (error) {
    console.error("GET /api/referrals/me", error);
    return NextResponse.json({ error: error.message ?? "Referral-Link konnte nicht geladen werden." }, { status: 500 });
  }
}
