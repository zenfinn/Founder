import { NextResponse } from "next/server";
import { canManageResource } from "@/lib/founder-contact";
import { deleteResource } from "@/lib/groups";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function DELETE(_request, { params }) {
  try {
    const resourceId = String(params?.resourceId ?? "").trim();
    if (!resourceId) {
      return NextResponse.json({ error: "Ressourcen-ID fehlt." }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Bitte logge dich ein." }, { status: 401 });
    }

    const adminSupabase = createAdminSupabaseClient();
    const { data: resource, error: fetchError } = await adminSupabase
      .from("posts")
      .select("id, author_id, type, deleted_at")
      .eq("id", resourceId)
      .eq("type", "resource")
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!resource || resource.deleted_at) {
      return NextResponse.json({ error: "Ressource nicht gefunden." }, { status: 404 });
    }

    if (!canManageResource({ userEmail: user.email, userId: user.id, authorId: resource.author_id })) {
      return NextResponse.json({ error: "Keine Berechtigung zum Löschen." }, { status: 403 });
    }

    await deleteResource(adminSupabase, resourceId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/resources/[resourceId]", error);
    return NextResponse.json({ error: error.message ?? "Ressource konnte nicht gelöscht werden." }, { status: 500 });
  }
}
