"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { shouldShowFounderOnboarding } from "@/lib/founder-ai-onboarding";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function FounderOnboardingGate({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const onOnboardingPage = pathname?.startsWith("/onboarding/founder");
  const onJarvisPage = pathname?.startsWith("/jarvis");
  const skipEnforce = onOnboardingPage || onJarvisPage;
  const [ready, setReady] = useState(skipEnforce);

  useEffect(() => {
    if (skipEnforce) {
      setReady(true);
      return;
    }

    let cancelled = false;

    async function enforceOnboarding() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (user?.id && shouldShowFounderOnboarding(user.id, user.email)) {
        router.replace("/onboarding/founder");
        return;
      }

      setReady(true);
    }

    setReady(false);
    enforceOnboarding();

    return () => {
      cancelled = true;
    };
  }, [pathname, router, skipEnforce, supabase]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-neutral-500">Founder wird geladen…</p>
      </div>
    );
  }

  return children;
}
