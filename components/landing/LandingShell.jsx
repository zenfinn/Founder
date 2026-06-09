"use client";

import { GlobeBackground } from "@/components/cockpit/GlobeBackground";

export function LandingShell({ children }) {
  return (
    <div data-cockpit="true" className="relative isolate min-h-dvh bg-[#050505] text-neutral-100">
      <GlobeBackground />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
