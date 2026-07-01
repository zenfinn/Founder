"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { UserHeaderControls } from "@/components/UserHeaderControls";
import { CockpitBottomNav } from "@/components/cockpit/CockpitBottomNav";
import { GlobeBackground } from "@/components/cockpit/GlobeBackground";
import { FounderGlobeProvider } from "@/components/cockpit/FounderGlobeContext";
import { FounderOnboardingGate } from "@/components/onboarding/FounderOnboardingGate";

export function CockpitShell({ children }) {
  const pathname = usePathname() ?? "";
  const onOnboarding = pathname.startsWith("/onboarding");

  return (
    <FounderGlobeProvider>
      <div
        data-cockpit="true"
        className="cockpit-root relative isolate flex min-h-dvh flex-col bg-[#050505] text-neutral-100"
      >
        <GlobeBackground />

      <header className="relative z-20 flex shrink-0 items-center justify-between px-4 py-4 md:px-6">
        <Link href="/dashboard" className="opacity-90 transition hover:opacity-100">
          <BrandMark />
        </Link>
        <div className="cockpit-header-controls">
          <UserHeaderControls variant="app" />
        </div>
      </header>

      <main className={`relative z-10 min-h-0 flex-1 ${onOnboarding ? "pb-6" : "pb-28"}`}>
        <FounderOnboardingGate>{children}</FounderOnboardingGate>
      </main>

      <CockpitBottomNav />
    </div>
    </FounderGlobeProvider>
  );
}
