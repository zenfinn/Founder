import { communityChannels } from "@/lib/founder-data";
import { canJoinMoreCommunities, getMembershipLimitMessage, hasFullAccess, isFounderPro } from "@/lib/membership";
import { getOwnProfile } from "@/lib/profiles";
import { joinGroup } from "@/lib/groups";

const GROUP_SELECT =
  "id,name,category,slug,description,min_rank,requires_founder_pro,member_count,created_at,updated_at";

export async function ensureCommunitiesSeeded(adminSupabase) {
  const { count, error: countError } = await adminSupabase.from("groups").select("*", { count: "exact", head: true });
  if (countError) throw countError;
  if ((count ?? 0) > 0) return;

  const rows = communityChannels.map((channel) => ({
    name: channel.name,
    category: channel.category,
    slug: channel.slug,
    description: channel.description,
    min_rank: channel.min_rank ?? "aspiring",
    requires_founder_pro: channel.requires_founder_pro ?? false,
    member_count: channel.member_count ?? 0,
  }));

  const { error } = await adminSupabase.from("groups").upsert(rows, { onConflict: "category" });
  if (error) throw error;
}

export async function listCommunitiesForUser(supabase, userId) {
  const [{ data: groups, error: groupsError }, profile, membershipResult] = await Promise.all([
    supabase.from("groups").select(GROUP_SELECT).order("name"),
    userId ? getOwnProfile(supabase, userId) : null,
    userId
      ? supabase.from("group_members").select("group_id").eq("user_id", userId)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (groupsError) throw groupsError;
  if (membershipResult.error) throw membershipResult.error;

  const membershipIds = new Set((membershipResult.data ?? []).map((row) => row.group_id));
  const proMember = isFounderPro(profile);
  const fullAccess = hasFullAccess(profile);
  const membershipCount = membershipIds.size;
  const canJoinMore = canJoinMoreCommunities(profile, membershipCount);

  const communities = (groups ?? []).map((group) => {
    const isMember = membershipIds.has(group.id);
    const needsPro = group.requires_founder_pro && !proMember && !fullAccess;
    const canJoin = !isMember && !needsPro && (canJoinMore || fullAccess);

    return {
      ...group,
      is_member: isMember,
      can_join: canJoin,
      needs_pro: needsPro,
    };
  });

  return {
    communities,
    profile,
    membershipCount,
    canJoinMore: canJoinMore || fullAccess,
    proMember: proMember || fullAccess,
  };
}

export async function joinCommunityForUser(supabase, { groupId, userId }) {
  const profile = await getOwnProfile(supabase, userId);

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id,name,requires_founder_pro")
    .eq("id", groupId)
    .maybeSingle();

  if (groupError) throw groupError;
  if (!group) {
    const error = new Error("Community nicht gefunden.");
    error.status = 404;
    throw error;
  }

  if (group.requires_founder_pro && !isFounderPro(profile) && !hasFullAccess(profile)) {
    const error = new Error("Diese Community erfordert Founder Pro.");
    error.status = 403;
    throw error;
  }

  try {
    await joinGroup(supabase, { groupId, userId, profile });
  } catch (joinError) {
    const error = new Error(joinError.message ?? getMembershipLimitMessage("community"));
    error.status = 409;
    throw error;
  }

  return { groupId: group.id, groupName: group.name };
}
