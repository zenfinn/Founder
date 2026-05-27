import { NextResponse } from "next/server";
import { joinCommunityForUser } from "@/lib/communities";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(_request, { params }) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Bitte logge dich ein." }, { status: 401 });
    }

    const groupId = params?.groupId;
    if (!groupId) {
      return NextResponse.json({ error: "Community-ID fehlt." }, { status: 400 });
    }

    const result = await joinCommunityForUser(supabase, { groupId, userId: user.id });
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/communities/[groupId]/join", error);
    return NextResponse.json(
      { error: error.message ?? "Beitritt fehlgeschlagen." },
      { status: error.status ?? 500 }
    );
  }
}
