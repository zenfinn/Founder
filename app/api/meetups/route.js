import { NextResponse } from "next/server";
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

    const { data: approved, error: approvedError } = await supabase
      .from("event_submissions")
      .select("id, title, description, starts_at, location_text, category, host_info, status, created_at, user_id")
      .eq("status", "approved")
      .order("starts_at", { ascending: true, nullsFirst: false });

    if (approvedError) throw approvedError;

    const { data: mine, error: mineError } = await supabase
      .from("event_submissions")
      .select("id, title, description, starts_at, location_text, category, host_info, status, created_at")
      .eq("user_id", user.id)
      .neq("status", "approved")
      .order("created_at", { ascending: false });

    if (mineError) throw mineError;

    const hostIds = [...new Set((approved ?? []).map((row) => row.user_id).filter(Boolean))];
    let profilesById = {};

    if (hostIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, current_rank, company_name, industry")
        .in("id", hostIds);

      if (profilesError) throw profilesError;
      profilesById = Object.fromEntries((profiles ?? []).map((profile) => [profile.id, profile]));
    }

    const meetups = (approved ?? []).map((row) => ({
      ...row,
      host: profilesById[row.user_id] ?? null,
    }));

    return NextResponse.json({ meetups, mine: mine ?? [] });
  } catch (error) {
    console.error("GET /api/meetups", error);
    return NextResponse.json({ error: error.message ?? "Meetups konnten nicht geladen werden." }, { status: 500 });
  }
}
