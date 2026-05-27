"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { FounderProUpgradeButton } from "@/components/FounderProUpgradeButton";
import { GroupDetail } from "@/components/groups/GroupDetail";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { CheckCircle, Lock, ShieldCheck } from "lucide-react";

const proBenefits = [
  "Exklusive Premium-Gruppen direkt in Founder",
  "Native Echtzeit-Chats, Ressourcen-Ranking und Community Wins",
  "Früher Zugang zu Events und kuratierten Founder Deals",
  "Monatlicher Founder Report für Wachstum und Märkte",
];

const SHOW_UPGRADE_BANNER = false;

function isFounderProProfile(profile) {
  const subscriptionStatus = String(profile?.subscription_status ?? "").toLowerCase();
  const plan = String(profile?.plan ?? "").toLowerCase();

  return (
    profile?.founder_pro === true ||
    profile?.is_pro === true ||
    plan === "pro" ||
    plan === "founder_pro" ||
    subscriptionStatus === "active" ||
    subscriptionStatus === "pro" ||
    subscriptionStatus === "founder_pro"
  );
}

function FounderProPaywall() {
  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader active="/community" />
      <section className="px-4 py-12">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-founder-600 p-6 text-white shadow-2xl shadow-founder-950/20 sm:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <Lock className="h-7 w-7" />
          </div>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.22em] text-founder-100">Founder Pro erforderlich</p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight sm:text-6xl">Founder Pro – 14,99€ / Monat</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-founder-50">
            Diese Gruppe ist Teil des nativen Founder-Pro-Bereichs. Upgrade jetzt, um Chat, Ressourcen-Ranking und
            Community Wins freizuschalten.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {proBenefits.map((benefit) => (
              <div key={benefit} className="flex gap-3 rounded-2xl bg-white/10 p-4 text-sm font-semibold text-white">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-founder-100" />
                {benefit}
              </div>
            ))}
          </div>

          <FounderProUpgradeButton />
        </div>
      </section>
    </main>
  );
}

export function GroupAccessGate({ groupId }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let profileChannel;
    let active = true;

    async function checkFounderProAccess() {
      try {
        if (!groupId) {
          setError("Keine Gruppen-ID übergeben.");
          setAllowed(false);
          return;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;

        if (!user) {
          setAllowed(false);
          return;
        }

        const loadProfile = async () => {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

          if (profileError) throw profileError;
          if (active) setAllowed(isFounderProProfile(profile));
        };

        await loadProfile();
        if (!active) return;

        const channel = supabase
          .channel(`founder-pro-profile-${user.id}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
            (payload) => {
              if (active) setAllowed(isFounderProProfile(payload.new));
            }
          );

        profileChannel = channel;
        channel.subscribe();
      } catch (accessError) {
        if (active) {
          setError(accessError?.message ?? "Founder-Pro-Zugriff konnte nicht geprüft werden.");
          setAllowed(false);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    checkFounderProAccess();

    return () => {
      active = false;
      if (profileChannel) {
        supabase.removeChannel(profileChannel);
      }
    };
  }, [groupId, supabase]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-600">
          <ShieldCheck className="h-5 w-5 text-founder-600" />
          Founder-Pro-Zugriff wird geprüft...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50">
        <AppHeader active="/community" />
        <section className="px-4 py-12">
          <div className="mx-auto max-w-3xl rounded-[2rem] border border-red-100 bg-red-50 p-6 text-red-800">
            <p className="font-bold">Paywall konnte nicht geprüft werden.</p>
            <p className="mt-2 text-sm leading-6">{error}</p>
            <Link href="/community" className="mt-5 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-bold text-red-800">
              Zur Community
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!allowed) {
    return SHOW_UPGRADE_BANNER ? <FounderProPaywall /> : <GroupDetail groupId={groupId} />;
  }

  return <GroupDetail groupId={groupId} />;
}
