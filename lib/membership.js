export function hasFullAccess(profile) {
  const role = profile?.system_role ?? "member";
  return role === "owner" || role === "admin";
}

export function isFounderPro(profile) {
  if (hasFullAccess(profile)) return true;

  const plan = String(profile?.plan ?? "").toLowerCase();
  const subscriptionStatus = String(profile?.subscription_status ?? "").toLowerCase();

  return (
    profile?.founder_pro === true ||
    profile?.is_pro === true ||
    plan === "pro" ||
    plan === "founder_pro" ||
    subscriptionStatus === "active" ||
    subscriptionStatus === "pro" ||
    subscriptionStatus === "founder_pro"
  );
}

export function canAccessResources(profile) {
  return isFounderPro(profile);
}

export const BASIC_COMMUNITY_LIMIT = 1;
export const BASIC_SUBGROUP_LIMIT = 1;

export function canJoinMoreCommunities(profile, currentCount = 0) {
  if (isFounderPro(profile)) return true;
  return currentCount < BASIC_COMMUNITY_LIMIT;
}

export function canJoinMoreSubgroups(profile, currentCount = 0) {
  if (isFounderPro(profile)) return true;
  return currentCount < BASIC_SUBGROUP_LIMIT;
}

export function getMembershipLimitMessage(type = "community") {
  if (type === "subgroup") {
    return "Im Basic-Plan kannst du nur 1 Community und 1 Untergruppe beitreten. Upgrade auf Founder Pro für unbegrenzten Zugang.";
  }
  return "Im Basic-Plan kannst du nur 1 Community beitreten. Upgrade auf Founder Pro für unbegrenzten Zugang.";
}

export function getProfileWelcomeName(profile) {
  if (profile?.username?.trim()) return `@${profile.username.trim()}`;
  if (profile?.display_name?.trim()) return profile.display_name.trim();
  return "Founder";
}

export function isPlatformOwner(profile) {
  return profile?.system_role === "owner";
}
