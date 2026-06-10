"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAutoCompletedSteps,
  getOnboardingProgressPercent,
  isOnboardingComplete,
  mergeOnboardingSteps,
  readOnboardingProgress,
  writeOnboardingProgress,
} from "@/lib/onboarding-steps";

export function useOnboardingStatus({ userId, profile, verificationStatus, communitiesCount }) {
  const currentRank = profile?.current_rank ?? "aspiring";

  const autoCompleted = useMemo(
    () =>
      getAutoCompletedSteps({
        profile,
        verificationStatus,
        currentRank,
        communitiesCount,
      }),
    [profile, verificationStatus, currentRank, communitiesCount]
  );

  const [steps, setSteps] = useState(() => mergeOnboardingSteps(readOnboardingProgress(userId), autoCompleted));

  useEffect(() => {
    if (!userId) return;

    function syncSteps() {
      setSteps(mergeOnboardingSteps(readOnboardingProgress(userId), autoCompleted));
    }

    syncSteps();
    writeOnboardingProgress(userId, mergeOnboardingSteps(readOnboardingProgress(userId), autoCompleted));
    window.addEventListener("founder-onboarding-update", syncSteps);
    return () => window.removeEventListener("founder-onboarding-update", syncSteps);
  }, [userId, autoCompleted]);

  const progress = getOnboardingProgressPercent(steps);
  const complete = isOnboardingComplete(steps);

  return { steps, progress, complete, autoCompleted, setSteps };
}
