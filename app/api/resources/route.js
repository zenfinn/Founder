import { NextResponse } from "next/server";
import { getAllApprovedResources } from "@/lib/groups";
import { isFounderPro } from "@/lib/membership";
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

    const profile = await getOwnProfile(supabase, user.id);
    if (!isFounderPro(profile)) {
      return NextResponse.json({ error: "Founder Pro erforderlich.", proRequired: true }, { status: 403 });
    }

    const resources = await getAllApprovedResources(supabase);
    return NextResponse.json({ resources });
  } catch (error) {
    console.error("GET /api/resources", error);
    return NextResponse.json({ error: error.message ?? "Ressourcen konnten nicht geladen werden." }, { status: 500 });
  }
}
