import { withDisplayMemberCount, withDisplaySubgroupMemberCount } from "@/lib/community-display";
import {
  fetchAllLegacyTools,
  fetchLegacyToolsForGroup,
  mergeCommunityTools,
  postMatchesCommunityScope,
  resolveCommunityToolScope,
} from "@/lib/community-tools";
import { fetchGlobalLoungeGroup, isGlobalLounge } from "@/lib/dashboard-lounge";
import { withDisplayResourceVotes } from "@/lib/resource-display";

export async function getGroups(supabase) {
  const { data, error } = await supabase
    .from("groups")
    .select("id,name,category,slug,description,min_rank,requires_founder_pro,member_count")
    .order("name");
  if (error) throw error;
  return (data ?? []).map(withDisplayMemberCount);
}

export async function isUserGroupMember(supabase, groupId, userId) {
  if (!groupId || !userId) return false;

  const { data, error } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function getGroupById(supabase, groupId) {
  const { data, error } = await supabase
    .from("groups")
    .select("id,name,category,slug,description,min_rank,requires_founder_pro,member_count")
    .eq("id", groupId)
    .maybeSingle();
  if (error) throw error;
  return data ? withDisplayMemberCount(data) : null;
}

export async function getProfilesByIds(supabase, userIds) {
  const ids = [...new Set((userIds ?? []).filter(Boolean))];
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id,display_name,username,current_rank,avatar_url,interests")
    .in("id", ids);

  if (error) throw error;
  return data ?? [];
}

function mapResourcePost(row, { viewerId = null } = {}) {
  const meta = row.metadata ?? {};
  const actualUpvotes = meta.upvotes ?? 0;
  const actualDownvotes = meta.downvotes ?? 0;
  const viewerVote = viewerId && meta.votes?.[viewerId] ? meta.votes[viewerId] : null;

  return {
    id: row.id,
    group_id: row.group_id,
    title: row.content,
    url: meta.url ?? "",
    type: meta.resource_type ?? "saas_ai_tools",
    user_id: row.author_id,
    created_at: row.created_at,
    actualUpvotes,
    actualDownvotes,
    upvotes: actualUpvotes,
    downvotes: actualDownvotes,
    score: actualUpvotes - actualDownvotes,
    group: row.groups ?? null,
    viewerVote,
  };
}

function mapWinPost(row) {
  const meta = row.metadata ?? {};

  return {
    id: row.id,
    group_id: row.group_id,
    user_id: row.author_id,
    title: row.content,
    image_url: meta.image_url ?? null,
    created_at: row.created_at,
  };
}

export async function getMessages(supabase, groupId) {
  const { data, error } = await supabase
    .from("posts")
    .select("id,group_id,author_id,content,created_at")
    .eq("group_id", groupId)
    .eq("type", "message")
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) throw error;
  return data ?? [];
}

export async function postMessage(supabase, { groupId, userId, messageText }) {
  const { data, error } = await supabase
    .from("posts")
    .insert({ group_id: groupId, author_id: userId, content: messageText, type: "message" })
    .select("id,group_id,author_id,content,created_at")
    .single();

  if (error) throw error;
  return data;
}

function computeResourceVoteMetadata(metadata, userId, voteType) {
  const base = metadata ?? {};
  const votes = { ...(base.votes ?? {}) };
  const previousVote = votes[userId];

  if (previousVote === voteType) {
    delete votes[userId];
  } else {
    votes[userId] = voteType;
  }

  let upvotes = 0;
  let downvotes = 0;
  Object.values(votes).forEach((vote) => {
    if (vote === "up") upvotes += 1;
    if (vote === "down") downvotes += 1;
  });

  return { ...base, votes, upvotes, downvotes };
}

function isApprovedResourceRow(row) {
  const status = row?.metadata?.status;
  return !status || status === "approved";
}

export async function getResourceRankings(supabase, groupId, { viewerId = null } = {}) {
  const group = await getGroupById(supabase, groupId);
  if (!group) return [];

  const scope = await resolveCommunityToolScope(supabase, group);

  const { data, error } = await supabase
    .from("posts")
    .select("id, group_id, author_id, content, metadata, created_at, groups(id, name, category, slug)")
    .eq("type", "resource")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const postTools = (data ?? [])
    .filter(isApprovedResourceRow)
    .filter((row) => postMatchesCommunityScope(row, scope))
    .map((row) => mapResourcePost(row, { viewerId }));

  const legacyTools = await fetchLegacyToolsForGroup(supabase, scope.canonical ?? group);

  return mergeCommunityTools(postTools, legacyTools);
}

export async function getAllApprovedResources(supabase) {
  const [{ data, error }, legacyTools] = await Promise.all([
    supabase
      .from("posts")
      .select("id, group_id, author_id, content, metadata, created_at, groups(id, name, category, slug)")
      .eq("type", "resource")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    fetchAllLegacyTools(supabase),
  ]);

  if (error) throw error;

  const postTools = (data ?? [])
    .filter(isApprovedResourceRow)
    .map((row) => mapResourcePost(row));

  return mergeCommunityTools(postTools, legacyTools);
}

export async function createResource(supabase, { groupId, userId, title, url, type, status = "approved" }) {
  const { data, error } = await supabase
    .from("posts")
    .insert({
      group_id: groupId,
      author_id: userId,
      content: title,
      type: "resource",
      metadata: {
        url,
        resource_type: type,
        status,
        upvotes: 0,
        downvotes: 0,
        votes: {},
      },
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteResource(supabase, resourceId) {
  const { error } = await supabase
    .from("posts")
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", resourceId)
    .eq("type", "resource");

  if (error) throw error;
}

export async function upsertResourceVote(supabase, { resourceId, userId, voteType }) {
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("id, metadata")
    .eq("id", resourceId)
    .eq("type", "resource")
    .is("deleted_at", null)
    .single();

  if (fetchError) throw fetchError;

  const nextMetadata = computeResourceVoteMetadata(post.metadata, userId, voteType);

  const { error: updateError } = await supabase
    .from("posts")
    .update({
      metadata: nextMetadata,
      updated_at: new Date().toISOString(),
    })
    .eq("id", resourceId)
    .eq("type", "resource");

  if (updateError) throw updateError;
}

export async function getCommunityWins(supabase, groupId) {
  const { data, error } = await supabase
    .from("posts")
    .select("id,group_id,author_id,content,metadata,created_at")
    .eq("group_id", groupId)
    .eq("type", "win")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapWinPost);
}

export async function postCommunityWin(supabase, { groupId, userId, title, imageUrl }) {
  const { data, error } = await supabase
    .from("posts")
    .insert({
      group_id: groupId,
      author_id: userId,
      content: title,
      type: "win",
      metadata: { image_url: imageUrl || null },
    })
    .select("id,group_id,author_id,content,metadata,created_at")
    .single();

  if (error) throw error;
  return mapWinPost(data);
}

export async function getGroupSubgroups(supabase, groupId) {
  const { data, error } = await supabase
    .from("group_subgroups")
    .select("id,group_id,owner_id,name,slug,description,visibility,member_count,created_at")
    .eq("group_id", groupId)
    .order("member_count", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(withDisplaySubgroupMemberCount);
}

export async function getGroupSubgroupsWithMembership(supabase, groupId, userId) {
  const subgroups = await getGroupSubgroups(supabase, groupId);
  if (!userId || subgroups.length === 0) {
    return subgroups.map((subgroup) => ({
      ...subgroup,
      is_member: false,
      is_owner: false,
    }));
  }

  const subgroupIds = subgroups.map((subgroup) => subgroup.id);
  const { data: memberships, error } = await supabase
    .from("group_subgroup_members")
    .select("subgroup_id")
    .eq("user_id", userId)
    .in("subgroup_id", subgroupIds);

  if (error) throw error;

  const memberIds = new Set((memberships ?? []).map((row) => row.subgroup_id));

  return subgroups.map((subgroup) => ({
    ...subgroup,
    is_member: memberIds.has(subgroup.id),
    is_owner: subgroup.owner_id === userId,
  }));
}

export function getJoinableSubgroups(subgroups = []) {
  return subgroups.filter((subgroup) => subgroup.visibility !== "private" || subgroup.is_member || subgroup.is_owner);
}

export function getListedSubgroups(subgroups = []) {
  return subgroups.filter((subgroup) => subgroup.visibility !== "private");
}

export async function createGroupSubgroup(supabase, { groupId, userId, name, description, visibility = "listed", profile }) {
  const { canJoinMoreSubgroups, getMembershipLimitMessage } = await import("./membership.js");
  const { count } = await supabase
    .from("group_subgroup_members")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (!canJoinMoreSubgroups(profile, count ?? 0)) {
    throw new Error(getMembershipLimitMessage("subgroup"));
  }

  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  const { data, error } = await supabase
    .from("group_subgroups")
    .insert({
      group_id: groupId,
      owner_id: userId,
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      visibility,
    })
    .select("id,group_id,owner_id,name,slug,description,visibility,member_count,created_at")
    .single();

  if (error) throw error;

  await supabase.from("group_subgroup_members").insert({ subgroup_id: data.id, user_id: userId });

  return withDisplaySubgroupMemberCount(data);
}

export async function joinGroupSubgroup(supabase, { subgroupId, userId, profile }) {
  const { data: existing } = await supabase
    .from("group_subgroup_members")
    .select("id")
    .eq("subgroup_id", subgroupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return existing;

  const { canJoinMoreSubgroups } = await import("./membership.js");
  const { count } = await supabase
    .from("group_subgroup_members")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (!canJoinMoreSubgroups(profile, count ?? 0)) {
    const { getMembershipLimitMessage } = await import("./membership.js");
    throw new Error(getMembershipLimitMessage("subgroup"));
  }

  const { data, error } = await supabase
    .from("group_subgroup_members")
    .upsert({ subgroup_id: subgroupId, user_id: userId }, { onConflict: "subgroup_id,user_id", ignoreDuplicates: true })
    .select("id,subgroup_id,user_id")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function joinGroup(supabase, { groupId, userId, profile }) {
  const { data: existing } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return existing;

  const { canJoinMoreCommunities, getMembershipLimitMessage } = await import("./membership.js");
  const lounge = await fetchGlobalLoungeGroup(supabase);
  let countQuery = supabase.from("group_members").select("*", { count: "exact", head: true }).eq("user_id", userId);
  if (lounge?.id) countQuery = countQuery.neq("group_id", lounge.id);
  const { count } = await countQuery;

  if (!canJoinMoreCommunities(profile, count ?? 0)) {
    throw new Error(getMembershipLimitMessage("community"));
  }

  const { data, error } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, user_id: userId })
    .select("id,group_id,user_id")
    .single();

  if (error) throw error;
  return data;
}

export async function getUserCommunities(supabase, userId) {
  const { data, error } = await supabase
    .from("group_members")
    .select("id,group_id,groups(id,name,category,slug,member_count)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? [])
    .map((row) => withDisplayMemberCount(row.groups))
    .filter(Boolean)
    .filter((group) => !isGlobalLounge(group));
}

export async function getUserSubgroups(supabase, userId) {
  const { data, error } = await supabase
    .from("group_subgroup_members")
    .select("id,subgroup_id,group_subgroups(id,name,slug,group_id,groups(id,name,category))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => {
    const subgroup = row.group_subgroups;
    if (!subgroup) return null;
    return {
      id: subgroup.id,
      name: subgroup.name,
      slug: subgroup.slug,
      group_id: subgroup.group_id,
      group_name: subgroup.groups?.name ?? "Community",
      group_category: subgroup.groups?.category ?? "",
    };
  }).filter(Boolean);
}

export async function getUserMentorBookings(supabase, userId) {
  const { data, error } = await supabase
    .from("mentor_bookings")
    .select("id,mentor_key,mentor_name,status,starts_at,amount_cents")
    .eq("user_id", userId)
    .in("status", ["paid", "confirmed", "completed"])
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
