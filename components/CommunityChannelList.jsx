"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { communityChannels } from "@/lib/founder-data";
import { RankBadge } from "@/components/RankBadge";
import { Bot, Coins, Globe, Package, ShoppingBag, Store, TrendingUp, Video, Youtube } from "lucide-react";

const categoryStyles = {
  Allgemein: "bg-slate-100 text-slate-700",
  "Wins & Erfolge": "bg-emerald-50 text-emerald-700",
  Reselling: "bg-amber-50 text-amber-700",
  Dropshipping: "bg-blue-50 text-blue-700",
  "E-Commerce": "bg-indigo-50 text-indigo-700",
  "Amazon FBA": "bg-amber-50 text-amber-700",
  "TikTok Creator": "bg-fuchsia-50 text-fuchsia-700",
  "TikTok Shop": "bg-pink-50 text-pink-700",
  "KI Creator": "bg-violet-50 text-violet-700",
  Trading: "bg-red-50 text-red-700",
  "Memecoin Trading": "bg-orange-50 text-orange-700",
  "YouTube Automation": "bg-rose-50 text-rose-700",
  "Digital Business": "bg-cyan-50 text-cyan-700",
  "Founder Pro": "bg-founder-50 text-founder-700",
};

const groupIcons = {
  Reselling: ShoppingBag,
  Dropshipping: Package,
  "E-Commerce": Store,
  "Amazon FBA": Package,
  "TikTok Creator": Video,
  "TikTok Shop": ShoppingBag,
  "KI Creator": Bot,
  Trading: TrendingUp,
  "Memecoin Trading": Coins,
  "YouTube Automation": Youtube,
  "Digital Business": Globe,
};

function normalizeChannel(channel) {
  const fallback = communityChannels.find((item) => item.slug === channel.slug);

  return {
    slug: channel.slug,
    name: channel.name,
    category: fallback?.category ?? channel.category,
    description: channel.description ?? fallback?.description ?? "Austausch für Founder Mitglieder.",
    min_rank: channel.min_rank ?? "aspiring",
    requires_founder_pro: channel.requires_founder_pro ?? fallback?.requires_founder_pro ?? false,
    icon: fallback?.icon ?? "F",
    member_count: channel.member_count ?? fallback?.member_count ?? 0,
  };
}

export function CommunityChannelList() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [channels, setChannels] = useState(communityChannels.filter((channel) => !channel.requires_founder_pro));

  useEffect(() => {
    async function loadChannels() {
      const { data, error } = await supabase
        .from("channels")
        .select("slug,name,category,description,min_rank,requires_founder_pro")
        .in(
          "slug",
          communityChannels.map((channel) => channel.slug)
        )
        .order("created_at", { ascending: true });

      if (!error && data?.length) {
        const merged = communityChannels.filter((channel) => !channel.requires_founder_pro).map((fallback) => {
          const remote = data.find((item) => item.slug === fallback.slug);
          return remote ? normalizeChannel(remote) : fallback;
        });
        setChannels(merged);
      }
    }

    loadChannels();
  }, [supabase]);

  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {channels.map((channel) => (
        (() => {
          const Icon = groupIcons[channel.category] ?? Globe;
          return (
        <Link
          key={channel.slug}
          href="/community"
          className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-founder-200"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-founder-600 text-white">
              <Icon className="h-6 w-6" />
            </div>
            <RankBadge rank={channel.min_rank} />
          </div>
          <span
            className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
              categoryStyles[channel.category] ?? "bg-slate-100 text-slate-700"
            }`}
          >
            {channel.category}
          </span>
          {channel.requires_founder_pro && (
            <p className="mt-4 inline-flex rounded-full bg-founder-600 px-3 py-1 text-xs font-bold text-white">
              Founder Pro
            </p>
          )}
          <h2 className="mt-5 font-serif text-2xl font-bold text-slate-950 group-hover:text-founder-600">
            {channel.name}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{channel.description}</p>
          <p className="mt-4 text-sm font-semibold text-slate-500">{channel.member_count.toLocaleString("de-DE")} Mitglieder</p>
          <p className="mt-5 text-sm font-bold text-founder-600">Channel öffnen</p>
        </Link>
          );
        })()
      ))}
    </div>
  );
}
