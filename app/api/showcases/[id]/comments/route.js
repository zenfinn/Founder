import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(_request, { params }) {
  try {
    const adminSupabase = createAdminSupabaseClient();
    const { data: comments, error } = await adminSupabase
      .from("showcase_comments")
      .select("id,showcase_id,user_id,content,created_at")
      .eq("showcase_id", params.id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const userIds = [...new Set((comments ?? []).map((row) => row.user_id))];
    const { data: profiles } = userIds.length
      ? await adminSupabase
          .from("profiles")
          .select("id,display_name,username,avatar_url,current_rank")
          .in("id", userIds)
      : { data: [] };

    const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

    return NextResponse.json({
      comments: (comments ?? []).map((row) => {
        const author = profileById.get(row.user_id);
        return {
          id: row.id,
          content: row.content,
          createdAt: row.created_at,
          author: {
            id: row.user_id,
            displayName: author?.display_name ?? author?.username ?? "Founder",
            avatarUrl: author?.avatar_url ?? "",
            rank: author?.current_rank ?? "aspiring",
          },
        };
      }),
    });
  } catch (error) {
    console.error("GET /api/showcases/[id]/comments", error);
    return NextResponse.json({ error: error.message ?? "Kommentare konnten nicht geladen werden." }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const supabase = createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Bitte logge dich ein, um zu kommentieren." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const content = String(body.content ?? "").trim();
    if (!content) {
      return NextResponse.json({ error: "Kommentar darf nicht leer sein." }, { status: 400 });
    }

    const { data, error } = await adminSupabase
      .from("showcase_comments")
      .insert({
        showcase_id: params.id,
        user_id: user.id,
        content: content.slice(0, 500),
      })
      .select("id,showcase_id,user_id,content,created_at")
      .single();

    if (error) throw error;

    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("id,display_name,username,avatar_url,current_rank")
      .eq("id", user.id)
      .maybeSingle();

    return NextResponse.json({
      comment: {
        id: data.id,
        content: data.content,
        createdAt: data.created_at,
        author: {
          id: user.id,
          displayName: profile?.display_name ?? profile?.username ?? "Founder",
          avatarUrl: profile?.avatar_url ?? "",
          rank: profile?.current_rank ?? "aspiring",
        },
      },
    });
  } catch (error) {
    console.error("POST /api/showcases/[id]/comments", error);
    return NextResponse.json({ error: error.message ?? "Kommentar fehlgeschlagen." }, { status: 500 });
  }
}
