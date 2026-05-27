import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getTrialDaysRemaining, isTrialActive } from "../utils/trialUtils";

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    let { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) {
      console.error("profiles load:", error.message);
      setProfile(null);
      return;
    }

    if (!data) {
      const trialStarted = new Date().toISOString();
      const { error: insertError } = await supabase.from("profiles").insert({
        id: userId,
        plan: "basic",
        trial_started_at: trialStarted,
      });
      if (insertError) {
        console.error("profiles bootstrap (30d trial):", insertError.message);
      }
      const second = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      data = second.data ?? null;
      if (second.error) {
        console.error("profiles reload:", second.error.message);
      }
    }

    setProfile(data ?? null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      await loadProfile(sessionUser?.id ?? null);
      if (!cancelled) setLoading(false);
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user ?? null;
      setUser(next);
      loadProfile(next?.id ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const hasProAccess = useMemo(() => {
    if (!user) return false;
    if (!profile) return true;
    if (profile.plan === "pro") return true;
    return isTrialActive(profile.trial_started_at);
  }, [user, profile]);

  const trialDaysRemaining = useMemo(() => {
    if (!user || !profile) return null;
    if (profile.plan === "pro") return null;
    if (!isTrialActive(profile.trial_started_at)) return null;
    return getTrialDaysRemaining(profile.trial_started_at);
  }, [user, profile]);

  const requirePro = useCallback(
    (fn) => {
      if (hasProAccess) {
        fn();
        return;
      }
      setPaywallOpen(true);
    },
    [hasProAccess]
  );

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      hasProAccess,
      trialDaysRemaining,
      paywallOpen,
      setPaywallOpen,
      requirePro,
      refreshProfile: () => loadProfile(user?.id ?? null),
    }),
    [user, profile, loading, hasProAccess, trialDaysRemaining, paywallOpen, requirePro, loadProfile]
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return ctx;
}
