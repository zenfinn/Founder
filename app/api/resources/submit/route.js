import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { getAdminEmail, isResourceModeratorEmail } from "@/lib/founder-contact";
import { createResource } from "@/lib/groups";
import { isValidResourceUrl, normalizeResourceUrl } from "@/lib/resource-types";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
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
      return NextResponse.json({ error: "Bitte logge dich ein, um eine Ressource einzureichen." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const groupId = String(body.group_id ?? "").trim();
    const title = String(body.title ?? "").trim();
    const type = String(body.type ?? "").trim();
    const rawUrl = String(body.url ?? "").trim();

    if (!groupId || !title || !type) {
      return NextResponse.json({ error: "Gruppe, Titel und Kategorie sind erforderlich." }, { status: 400 });
    }

    if (!isValidResourceUrl(rawUrl)) {
      return NextResponse.json({ error: "Bitte gib einen gültigen Link an." }, { status: 400 });
    }

    const url = normalizeResourceUrl(rawUrl);
    const userEmail = user.email ?? "";

    if (isResourceModeratorEmail(userEmail)) {
      const adminSupabase = createAdminSupabaseClient();
      const resource = await createResource(adminSupabase, {
        groupId,
        userId: user.id,
        title,
        url,
        type,
        status: "approved",
      });

      return NextResponse.json({ ok: true, live: true, id: resource.id });
    }

    const adminSupabase = createAdminSupabaseClient();
    const { data: group } = await adminSupabase.from("groups").select("name,category").eq("id", groupId).maybeSingle();

    await sendEmail({
      to: getAdminEmail(),
      subject: `Neue Ressource eingereicht: ${title} - ${url}`,
      text: [
        `Neue Ressource eingereicht: ${title} - ${url}`,
        "",
        group?.name ? `Community: ${group.name}` : null,
        group?.category ? `Kategorie: ${group.category}` : null,
        `Ressourcen-Typ: ${type}`,
        `Eingereicht von: ${userEmail || user.id}`,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    return NextResponse.json({ ok: true, pending: true });
  } catch (error) {
    console.error("POST /api/resources/submit", error);
    return NextResponse.json({ error: error.message ?? "Ressource konnte nicht eingereicht werden." }, { status: 500 });
  }
}
