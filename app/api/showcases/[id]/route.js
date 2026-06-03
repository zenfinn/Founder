import { NextResponse } from "next/server";
import { showcaseImageStoragePath } from "@/lib/showcases";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function DELETE(_request, { params }) {
  try {
    const supabase = createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Bitte logge dich ein." }, { status: 401 });
    }

    const showcaseId = params.id;
    const { data: showcase, error: fetchError } = await adminSupabase
      .from("showcases")
      .select("id, user_id, image_url")
      .eq("id", showcaseId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!showcase) {
      return NextResponse.json({ error: "Showcase nicht gefunden." }, { status: 404 });
    }

    const { data: adminRow } = await adminSupabase
      .from("founder_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (showcase.user_id !== user.id && !adminRow) {
      return NextResponse.json({ error: "Du darfst diesen Showcase nicht löschen." }, { status: 403 });
    }

    const storagePath = showcaseImageStoragePath(showcase.image_url);
    if (storagePath) {
      await adminSupabase.storage.from("showcase-images").remove([storagePath]);
    }

    const { error: deleteError } = await adminSupabase.from("showcases").delete().eq("id", showcaseId);
    if (deleteError) throw deleteError;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/showcases/[id]", error);
    return NextResponse.json({ error: error.message ?? "Showcase konnte nicht gelöscht werden." }, { status: 500 });
  }
}
