import { FounderAiOnboarding } from "@/components/onboarding/FounderAiOnboarding";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata("onboarding");

export default function FounderOnboardingPage() {
  return <FounderAiOnboarding />;
}
