import { NextResponse } from "next/server";
import { getDisplayCommentCount, getDisplayShowcaseUpvotes, getShowcasePreviewComments } from "@/lib/showcase-display";
import {
  buildShowcaseImageFields,
  getShowcaseImageUrls,
  mapShowcaseRow,
  normalizeShowcaseUrl,
  parseShowcaseImageUrls,
  showcaseImageStoragePath,
} from "@/lib/showcases";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function getShowcaseListIndex(adminSupabase, showcaseId) {
  const { data } = await adminSupabase.from("showcases").select("id").order("created_at", { ascending: false }).limit(60);
  const listIndex = (data ?? []).findIndex((row) => row.id === showcaseId);
  return listIndex >= 0 ? listIndex : null;
}

async function assertCanManageShowcase(adminSupabase, userId, showcaseId) {
  const { data: showcase, error: fetchError } = await adminSupabase
    .from("showcases")
    .select("id, user_id, image_url, image_urls")
    .eq("id", showcaseId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!showcase) {
    return { error: NextResponse.json({ error: "Showcase nicht gefunden." }, { status: 404 }) };
  }

  const { data: adminRow } = await adminSupabase
    .from("founder_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (showcase.user_id !== userId && !adminRow) {
    return { error: NextResponse.json({ error: "Keine Berechtigung für diesen Showcase." }, { status: 403 }) };
  }

  return { showcase };
}

export async function PATCH(request, { params }) {
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
    const access = await assertCanManageShowcase(adminSupabase, user.id, showcaseId);
    if (access.error) return access.error;

    const body = await request.json().catch(() => ({}));
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim().slice(0, 150);
    const imageUrls = parseShowcaseImageUrls(body);

    if (!title || !description || !imageUrls.length) {
      return NextResponse.json({ error: "Titel, Beschreibung und mindestens ein Bild sind Pflicht." }, { status: 400 });
    }

    const payload = {
      title,
      description,
      ...buildShowcaseImageFields(imageUrls),
      website_url: normalizeShowcaseUrl(body.website_url),
      instagram_url: normalizeShowcaseUrl(body.instagram_url),
      tiktok_url: normalizeShowcaseUrl(body.tiktok_url),
      linkedin_url: normalizeShowcaseUrl(body.linkedin_url),
    };

    const { data, error } = await adminSupabase.from("showcases").update(payload).eq("id", showcaseId).select("*").single();
    if (error) throw error;

    const listIndex = await getShowcaseListIndex(adminSupabase, showcaseId);
    const { data: comments } = await adminSupabase
      .from("showcase_comments")
      .select("showcase_id")
      .eq("showcase_id", showcaseId);
    const actualCommentCount = (comments ?? []).length;

    const showcase = mapShowcaseRow(data, {
      commentCount: getDisplayCommentCount(showcaseId, actualCommentCount),
      previewComments: getShowcasePreviewComments(showcaseId),
      upvotes: getDisplayShowcaseUpvotes(showcaseId, data.upvotes ?? 0, { listIndex }),
      viewerHasUpvoted: false,
    });

    return NextResponse.json({ showcase });
  } catch (error) {
    console.error("PATCH /api/showcases/[id]", error);
    return NextResponse.json({ error: error.message ?? "Showcase konnte nicht aktualisiert werden." }, { status: 500 });
  }
}

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
    const access = await assertCanManageShowcase(adminSupabase, user.id, showcaseId);
    if (access.error) return access.error;

    const storagePaths = getShowcaseImageUrls(access.showcase)
      .map((url) => showcaseImageStoragePath(url))
      .filter(Boolean);

    if (storagePaths.length) {
      await adminSupabase.storage.from("showcase-images").remove(storagePaths);
    }

    const { error: deleteError } = await adminSupabase.from("showcases").delete().eq("id", showcaseId);
    if (deleteError) throw deleteError;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/showcases/[id]", error);
    return NextResponse.json({ error: error.message ?? "Showcase konnte nicht gelöscht werden." }, { status: 500 });
  }
}
