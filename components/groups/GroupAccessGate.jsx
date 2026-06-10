"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FounderProUpgradeButton } from "@/components/FounderProUpgradeButton";
import { CockpitPage, CockpitPanel } from "@/components/cockpit/CockpitPage";
import { GroupDetail } from "@/components/groups/GroupDetail";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { CheckCircle, Lock, ShieldCheck } from "lucide-react";

const proBenefits = [
  "Exklusive Premium-Gruppen direkt in Founder",
  "Native Echtzeit-Chats, Tools-Ranking und Community Wins",
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
    <CockpitPage eyebrow="Founder Pro" title="Founder Pro – 14,99€ / Monat" description="Diese Gruppe ist Teil des nativen Founder-Pro-Bereichs.">
      <CockpitPanel className="border-[#1a3aad]/50 bg-[#1a3aad]/20">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#1a3aad]/40">
          <Lock className="h-7 w-7 text-white" />
        </div>
        <p className="mt-6 max-w-2xl text-base leading-7 text-neutral-200">
          Upgrade jetzt, um Chat, Tools-Ranking und Community Wins freizuschalten.
        </p>

        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {proBenefits.map((benefit) => (
            <div key={benefit} className="flex gap-3 rounded-xl border border-[#1a3aad]/30 p-4 text-sm font-semibold text-neutral-100">
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#5b8cff]" />
              {benefit}
            </div>
          ))}
        </div>

        <FounderProUpgradeButton />
      </CockpitPanel>
    </CockpitPage>
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
      <CockpitPage>
        <CockpitPanel>
          <div className="flex items-center gap-3 text-sm font-semibold text-neutral-400">
            <ShieldCheck className="h-5 w-5 text-[#1a3aad]" />
            Founder-Pro-Zugriff wird geprüft...
          </div>
        </CockpitPanel>
      </CockpitPage>
    );
  }

  if (error) {
    return (
      <CockpitPage title="Paywall konnte nicht geprüft werden.">
        <CockpitPanel>
          <p className="text-sm leading-6 text-red-300">{error}</p>
          <Link href="/community" className="mt-5 inline-flex rounded-xl border border-[#1a3aad] px-5 py-3 text-sm font-bold text-white">
            Zur Community
          </Link>
        </CockpitPanel>
      </CockpitPage>
    );
  }

  if (!allowed) {
    return SHOW_UPGRADE_BANNER ? <FounderProPaywall /> : <GroupDetail groupId={groupId} />;
  }

  return <GroupDetail groupId={groupId} />;
}
