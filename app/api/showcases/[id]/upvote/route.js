import { NextResponse } from "next/server";
import { getDisplayShowcaseUpvotes } from "@/lib/showcase-display";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(_request, { params }) {
  try {
    const supabase = createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Bitte logge dich ein, um zu voten." }, { status: 401 });
    }

    const showcaseId = params.id;
    const { data: existing } = await adminSupabase
      .from("showcase_upvotes")
      .select("showcase_id")
      .eq("showcase_id", showcaseId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await adminSupabase
        .from("showcase_upvotes")
        .delete()
        .eq("showcase_id", showcaseId)
        .eq("user_id", user.id);
      if (error) throw error;
    } else {
      const { error } = await adminSupabase.from("showcase_upvotes").insert({
        showcase_id: showcaseId,
        user_id: user.id,
      });
      if (error) throw error;
    }

    const [{ data: showcase, error }, { data: ordered }] = await Promise.all([
      adminSupabase.from("showcases").select("upvotes").eq("id", showcaseId).single(),
      adminSupabase.from("showcases").select("id").order("created_at", { ascending: false }).limit(60),
    ]);

    if (error) throw error;

    const listIndex = (ordered ?? []).findIndex((row) => row.id === showcaseId);
    const listPosition = listIndex >= 0 ? listIndex : null;

    return NextResponse.json({
      upvotes: getDisplayShowcaseUpvotes(showcaseId, showcase.upvotes ?? 0, { listIndex: listPosition }),
      viewerHasUpvoted: !existing,
    });
  } catch (error) {
    console.error("POST /api/showcases/[id]/upvote", error);
    return NextResponse.json({ error: error.message ?? "Upvote fehlgeschlagen." }, { status: 500 });
  }
}
