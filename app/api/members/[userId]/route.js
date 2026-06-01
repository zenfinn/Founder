import { NextResponse } from "next/server";
import { fetchMemberProfile } from "@/lib/member-profile";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Bitte logge dich ein." }, { status: 401 });
    }

    const userId = String(params?.userId ?? "").trim();
    if (!userId) {
      return NextResponse.json({ error: "User-ID fehlt." }, { status: 400 });
    }

    const profile = await fetchMemberProfile(supabase, userId);
    if (!profile) {
      return NextResponse.json({ error: "Profil nicht gefunden." }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("GET /api/members/[userId]", error);
    return NextResponse.json({ error: error.message ?? "Profil konnte nicht geladen werden." }, { status: 500 });
  }
}
