import { NextResponse } from "next/server";
import { getAllApprovedResources } from "@/lib/groups";
import { filterResourcesForMembership, isFounderPro } from "@/lib/membership";
import { getOwnProfile } from "@/lib/profiles";
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

    const [profile, membershipResult] = await Promise.all([
      getOwnProfile(supabase, user.id),
      supabase.from("group_members").select("group_id").eq("user_id", user.id),
    ]);

    if (membershipResult.error) throw membershipResult.error;

    const memberGroupIds = (membershipResult.data ?? []).map((row) => row.group_id);
    const proAccess = isFounderPro(profile);
    const allResources = await getAllApprovedResources(supabase);
    const resources = filterResourcesForMembership(allResources, memberGroupIds, profile);

    return NextResponse.json({
      resources,
      access: {
        pro: proAccess,
        memberGroupIds,
        hasGroupAccess: proAccess || memberGroupIds.length > 0,
      },
    });
  } catch (error) {
    console.error("GET /api/resources", error);
    return NextResponse.json({ error: error.message ?? "Ressourcen konnten nicht geladen werden." }, { status: 500 });
  }
}
