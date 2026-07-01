import { FounderAiOnboarding } from "@/components/onboarding/FounderAiOnboarding";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata("jarvis");

export default function JarvisPage() {
  return <FounderAiOnboarding persistent />;
}
