import { NextResponse } from "next/server";
import { getResourceRankings } from "@/lib/groups";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const groupId = request.nextUrl.searchParams.get("groupId")?.trim();
    if (!groupId) {
      return NextResponse.json({ error: "groupId fehlt." }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Bitte logge dich ein." }, { status: 401 });
    }

    const tools = await getResourceRankings(supabase, groupId, { viewerId: user.id });

    return NextResponse.json({ tools });
  } catch (error) {
    console.error("GET /api/resources/community", error);
    return NextResponse.json({ error: error.message ?? "Community-Tools konnten nicht geladen werden." }, { status: 500 });
  }
}
