import { communityChannels } from "@/lib/founder-data";

const baselinesBySlug = Object.fromEntries(communityChannels.map((channel) => [channel.slug, channel.member_count ?? 420]));

const baselinesByCategory = Object.fromEntries(
  communityChannels.map((channel) => [channel.category, channel.member_count ?? 420])
);

const SUBGROUP_MEMBER_BASELINE = 48;

export function getCommunityMemberBaseline(group = {}) {
  const slug = String(group.slug ?? "").toLowerCase();
  if (slug && baselinesBySlug[slug] != null) return baselinesBySlug[slug];

  const category = group.category;
  if (category && baselinesByCategory[category] != null) return baselinesByCategory[category];

  return 420;
}

export function getDisplayMemberCount(group = {}, actualCount = group.member_count) {
  const actual = Number(actualCount);
  const safeActual = Number.isFinite(actual) && actual > 0 ? Math.round(actual) : 0;
  const baseline = getCommunityMemberBaseline(group);

  if (safeActual >= baseline) return safeActual;
  return baseline + safeActual;
}

export function getDisplaySubgroupMemberCount(subgroup = {}, actualCount = subgroup.member_count) {
  const actual = Number(actualCount);
  const safeActual = Number.isFinite(actual) && actual > 0 ? Math.round(actual) : 0;

  if (safeActual >= SUBGROUP_MEMBER_BASELINE) return safeActual;
  return SUBGROUP_MEMBER_BASELINE + safeActual;
}

export function withDisplayMemberCount(group) {
  if (!group) return group;
  return {
    ...group,
    member_count: getDisplayMemberCount(group),
  };
}

export function withDisplaySubgroupMemberCount(subgroup) {
  if (!subgroup) return subgroup;
  return {
    ...subgroup,
    member_count: getDisplaySubgroupMemberCount(subgroup),
  };
}
