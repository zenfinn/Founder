import { NextResponse } from "next/server";
import { ensureCommunitiesSeeded, listCommunitiesForUser } from "@/lib/communities";
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

    let payload = await listCommunitiesForUser(supabase, user.id);

    if (payload.communities.length === 0) {
      const adminSupabase = createAdminSupabaseClient();
      await ensureCommunitiesSeeded(adminSupabase);
      payload = await listCommunitiesForUser(supabase, user.id);
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("GET /api/communities", error);
    return NextResponse.json({ error: error.message ?? "Communities konnten nicht geladen werden." }, { status: 500 });
  }
}
