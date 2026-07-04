import { NextResponse } from "next/server";
import { rankNichesForProfile } from "@/lib/founder-jarvis";
import { isGlobalLounge } from "@/lib/dashboard-lounge";
import { isProLoungeCommunity } from "@/lib/communities";
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
    const profile = body.profile && typeof body.profile === "object" ? body.profile : {};
    const messages = Array.isArray(body.messages) ? body.messages : [];

    const { data: groups, error: groupsError } = await supabase
      .from("groups")
      .select("id, name, category, slug, description, member_count")
      .order("member_count", { ascending: false });

    if (groupsError) throw groupsError;

    const eligible = (groups ?? []).filter(
      (group) => !isGlobalLounge(group) && !isProLoungeCommunity(group) && group.slug
    );

    const { rankedGroups, profilePatch } = await rankNichesForProfile(profile, eligible, { messages });

    return NextResponse.json({ rankedGroups, profilePatch });
  } catch (error) {
    console.error("POST /api/onboarding/founder/rank", error);
    return NextResponse.json({ error: error.message ?? "Ranking fehlgeschlagen." }, { status: 500 });
  }
}
