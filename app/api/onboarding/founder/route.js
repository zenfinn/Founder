import { NextResponse } from "next/server";
import {
  answerCoachQuestion,
  buildProfilePatchFromAnswers,
  rankCommunitiesFromAnswers,
} from "@/lib/founder-ai-onboarding";
import { isGlobalLounge } from "@/lib/dashboard-lounge";
import { isProLoungeCommunity } from "@/lib/communities";
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
      return NextResponse.json({ error: "Bitte logge dich ein." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const answers = {
      who: String(body.answers?.who ?? "").trim(),
      what: String(body.answers?.what ?? "").trim(),
      goals: String(body.answers?.goals ?? "").trim(),
      context: String(body.answers?.context ?? "").trim(),
    };
    const coachQuestion = String(body.question ?? "").trim();
    const joinedSlug = String(body.joined_slug ?? "").trim();

    const { data: groups, error: groupsError } = await supabase
      .from("groups")
      .select("id, name, category, slug, description, member_count")
      .order("member_count", { ascending: false });

    if (groupsError) throw groupsError;

    const eligible = (groups ?? []).filter(
      (group) => !isGlobalLounge(group) && !isProLoungeCommunity(group) && group.slug
    );

    const rankedGroups = rankCommunitiesFromAnswers(answers, eligible);
    const profilePatch = buildProfilePatchFromAnswers(answers, rankedGroups);

    const coachReply = coachQuestion
      ? answerCoachQuestion(coachQuestion, { rankedGroups, joinedSlug })
      : null;

    return NextResponse.json({
      rankedGroups: rankedGroups.map((group, index) => ({
        id: group.id,
        name: group.name,
        slug: group.slug,
        category: group.category,
        description: group.description,
        member_count: group.member_count,
        rank: index + 1,
        matchScore: group.matchScore,
        coachTip: group.coachTip,
      })),
      profilePatch,
      coachReply,
    });
  } catch (error) {
    console.error("POST /api/onboarding/founder", error);
    return NextResponse.json({ error: error.message ?? "Onboarding fehlgeschlagen." }, { status: 500 });
  }
}
