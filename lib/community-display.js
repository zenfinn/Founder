import { communityChannels } from "@/lib/founder-data";

export const MAX_DISPLAY_MEMBER_COUNT = 50;
export const MAX_DISPLAY_SUBGROUP_MEMBER_COUNT = 50;

const SUBGROUP_MEMBER_BASELINE = 12;

const displaySeedsBySlug = Object.fromEntries(
  communityChannels.map((channel) => [channel.slug, Math.min(MAX_DISPLAY_MEMBER_COUNT, channel.member_count ?? 36)])
);

const displaySeedsByCategory = Object.fromEntries(
  communityChannels.map((channel) => [channel.category, Math.min(MAX_DISPLAY_MEMBER_COUNT, channel.member_count ?? 36)])
);

export function getSeededMemberCount(group = {}) {
  const slug = String(group.slug ?? "").toLowerCase();
  if (slug && displaySeedsBySlug[slug] != null) return displaySeedsBySlug[slug];

  const category = group.category;
  if (category && displaySeedsByCategory[category] != null) return displaySeedsByCategory[category];

  return 36;
}

export function getDisplayMemberCount(group = {}, actualCount = group.member_count) {
  const seeded = getSeededMemberCount(group);
  const actual = Number(actualCount);
  const safeActual = Number.isFinite(actual) && actual > 0 ? Math.round(actual) : 0;

  if (safeActual <= 1 || safeActual > MAX_DISPLAY_MEMBER_COUNT) return seeded;
  return Math.min(MAX_DISPLAY_MEMBER_COUNT, Math.max(seeded, safeActual));
}

export function getDisplaySubgroupMemberCount(subgroup = {}, actualCount = subgroup.member_count) {
  const actual = Number(actualCount);
  const safeActual = Number.isFinite(actual) && actual > 0 ? Math.round(actual) : 0;

  if (safeActual <= 1 || safeActual > MAX_DISPLAY_SUBGROUP_MEMBER_COUNT) {
    return Math.min(MAX_DISPLAY_SUBGROUP_MEMBER_COUNT, SUBGROUP_MEMBER_BASELINE + 8);
  }

  const inflated = SUBGROUP_MEMBER_BASELINE + safeActual;
  if (inflated >= MAX_DISPLAY_SUBGROUP_MEMBER_COUNT) return MAX_DISPLAY_SUBGROUP_MEMBER_COUNT;
  return inflated;
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
