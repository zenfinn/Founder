import { hasFullAccess } from "@/lib/membership";

export const ONBOARDING_STEP_IDS = ["profile", "verify", "community"];

export const ONBOARDING_DISCOUNT_PERCENT = 20;

export function getOnboardingStorageKey(userId) {
  return `founder-onboarding-v1-${userId}`;
}

export function readOnboardingProgress(userId) {
  if (typeof window === "undefined" || !userId) {
    return { profile: false, verify: false, community: false, rewardDismissed: false };
  }

  try {
    const raw = window.localStorage.getItem(getOnboardingStorageKey(userId));
    if (!raw) {
      return { profile: false, verify: false, community: false, rewardDismissed: false };
    }
    const parsed = JSON.parse(raw);
    return {
      profile: Boolean(parsed.profile),
      verify: Boolean(parsed.verify),
      community: Boolean(parsed.community),
      rewardDismissed: Boolean(parsed.rewardDismissed),
    };
  } catch {
    return { profile: false, verify: false, community: false, rewardDismissed: false };
  }
}

export function writeOnboardingProgress(userId, progress) {
  if (typeof window === "undefined" || !userId) return;
  window.localStorage.setItem(getOnboardingStorageKey(userId), JSON.stringify(progress));
}

export function isProfileStepComplete(profile) {
  if (!profile) return false;
  const hasName = Boolean(profile.display_name?.trim());
  const hasUsername = Boolean(profile.username?.trim());
  const hasBusiness = Boolean(profile.company_name?.trim() || profile.industry?.trim());
  return hasName && hasUsername && hasBusiness;
}

export function isVerifyStepComplete({ verificationStatus, currentRank, profile }) {
  if (hasFullAccess(profile)) return true;
  if (verificationStatus === "approved") return true;
  return currentRank !== "aspiring";
}

export function isCommunityStepComplete({ communitiesCount, subgroupsCount, profile }) {
  if (hasFullAccess(profile)) return true;
  return communitiesCount > 0 || subgroupsCount > 0;
}

export function getAutoCompletedSteps({ profile, verificationStatus, currentRank, communitiesCount, subgroupsCount }) {
  return {
    profile: isProfileStepComplete(profile),
    verify: isVerifyStepComplete({ verificationStatus, currentRank, profile }),
    community: isCommunityStepComplete({ communitiesCount, subgroupsCount, profile }),
  };
}

export function mergeOnboardingSteps(stored, autoCompleted) {
  return {
    profile: stored.profile || autoCompleted.profile,
    verify: stored.verify || autoCompleted.verify,
    community: stored.community || autoCompleted.community,
    rewardDismissed: stored.rewardDismissed,
  };
}

export function isOnboardingComplete(steps) {
  return steps.profile && steps.verify && steps.community;
}

export function getOnboardingProgressPercent(steps) {
  const done = ONBOARDING_STEP_IDS.filter((id) => steps[id]).length;
  return Math.round((done / ONBOARDING_STEP_IDS.length) * 100);
}
