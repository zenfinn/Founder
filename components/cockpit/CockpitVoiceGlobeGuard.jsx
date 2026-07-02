"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useFounderGlobe } from "@/components/cockpit/FounderGlobeContext";

function isJarvisRoute(pathname = "") {
  return pathname.startsWith("/jarvis") || pathname.startsWith("/onboarding/founder");
}

/** Turn off voice-globe UI when leaving Jarvis so overlays never block other pages. */
export function CockpitVoiceGlobeGuard() {
  const pathname = usePathname() ?? "";
  const { setVoiceGlobe } = useFounderGlobe();

  useEffect(() => {
    if (isJarvisRoute(pathname)) return;

    setVoiceGlobe({ active: false, started: false, hint: "", error: "", tapDisabled: true });
  }, [pathname, setVoiceGlobe]);

  return null;
}
