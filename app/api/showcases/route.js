import { NextResponse } from "next/server";
import { getDisplayShowcaseUpvotes } from "@/lib/showcase-display";
import { canPostShowcase, mapShowcaseRow, normalizeShowcaseUrl } from "@/lib/showcases";
import { getOwnProfile } from "@/lib/profiles";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function enrichShowcases(adminSupabase, rows, viewerId) {
  if (!rows?.length) return [];

  const ids = rows.map((row) => row.id);
  const userIds = [...new Set(rows.map((row) => row.user_id))];

  const [{ data: profiles }, { data: comments }, viewerUpvotes] = await Promise.all([
    adminSupabase.from("profiles").select("id,display_name,username,avatar_url,current_rank").in("id", userIds),
    adminSupabase.from("showcase_comments").select("showcase_id").in("showcase_id", ids),
    viewerId
      ? adminSupabase.from("showcase_upvotes").select("showcase_id").eq("user_id", viewerId).in("showcase_id", ids)
      : Promise.resolve({ data: [] }),
  ]);

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const commentCounts = (comments ?? []).reduce((acc, row) => {
    acc[row.showcase_id] = (acc[row.showcase_id] ?? 0) + 1;
    return acc;
  }, {});
  const upvotedIds = new Set((viewerUpvotes.data ?? []).map((row) => row.showcase_id));

  return rows.map((row, index) =>
    mapShowcaseRow(row, {
      author: profileById.get(row.user_id) ?? null,
      commentCount: commentCounts[row.id] ?? 0,
      viewerHasUpvoted: upvotedIds.has(row.id),
      upvotes: getDisplayShowcaseUpvotes(row.id, row.upvotes ?? 0, { isNewest: index === 0 }),
    })
  );
}

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await adminSupabase
      .from("showcases")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(60);

    if (error) throw error;

    const showcases = await enrichShowcases(adminSupabase, data ?? [], user?.id ?? null);
    return NextResponse.json({ showcases, viewerId: user?.id ?? null });
  } catch (error) {
    console.error("GET /api/showcases", error);
    return NextResponse.json({ error: error.message ?? "Showcases konnten nicht geladen werden." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Bitte logge dich ein, um ein Showcase zu posten." }, { status: 401 });
    }

    const profile = await getOwnProfile(supabase, user.id);
    if (!canPostShowcase(profile?.current_rank ?? "aspiring")) {
      return NextResponse.json(
        { error: "Ab Starter-Rang kannst du Showcases posten. Verifiziere zuerst deinen Rang." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim().slice(0, 150);
    const imageUrl = String(body.image_url ?? "").trim();

    if (!title || !description || !imageUrl) {
      return NextResponse.json({ error: "Titel, Beschreibung und Bild sind Pflicht." }, { status: 400 });
    }

    const payload = {
      user_id: user.id,
      title,
      description,
      image_url: imageUrl,
      website_url: normalizeShowcaseUrl(body.website_url),
      instagram_url: normalizeShowcaseUrl(body.instagram_url),
      tiktok_url: normalizeShowcaseUrl(body.tiktok_url),
      linkedin_url: normalizeShowcaseUrl(body.linkedin_url),
    };

    const { data, error } = await adminSupabase.from("showcases").insert(payload).select("*").single();
    if (error) throw error;

    const [showcase] = await enrichShowcases(adminSupabase, [data], user.id);
    return NextResponse.json({ showcase });
  } catch (error) {
    console.error("POST /api/showcases", error);
    return NextResponse.json({ error: error.message ?? "Showcase konnte nicht erstellt werden." }, { status: 500 });
  }
}
