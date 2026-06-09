"use client";

import { GlobeBackground } from "@/components/cockpit/GlobeBackground";

export function LandingShell({ children, globeScale = 0.34, globeCenterY = 0.42, globeGlow = 1 }) {
  return (
    <div data-cockpit="true" className="relative isolate min-h-dvh bg-[#050505] text-neutral-100">
      <GlobeBackground scaleFactor={globeScale} centerY={globeCenterY} glowIntensity={globeGlow} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
