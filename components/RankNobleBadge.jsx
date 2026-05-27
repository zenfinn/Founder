import { Crown, Flame, Gem, Sprout, Zap } from "lucide-react";
import { getRankLabel } from "@/lib/founder-data";

const rankConfig = {
  aspiring: { Icon: Sprout, ring: "ring-slate-300/60", icon: "text-slate-500", bar: "bg-rank-aspiring" },
  starter: { Icon: Zap, ring: "ring-blue-300/60", icon: "text-rank-starter", bar: "bg-rank-starter" },
  builder: { Icon: Flame, ring: "ring-emerald-300/60", icon: "text-rank-builder", bar: "bg-rank-builder" },
  scaler: { Icon: Gem, ring: "ring-amber-300/60", icon: "text-rank-scaler", bar: "bg-rank-scaler" },
  elite: { Icon: Crown, ring: "ring-fuchsia-300/60", icon: "text-rank-elite", bar: "bg-rank-elite" },
};

export function RankNobleIcon({ rank = "aspiring", className = "" }) {
  const config = rankConfig[rank] ?? rankConfig.aspiring;
  const { Icon } = config;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border border-white bg-white p-0.5 shadow-md ring-1 ${config.ring} ${className}`}
      title={getRankLabel(rank)}
    >
      <Icon className={`h-3 w-3 ${config.icon}`} strokeWidth={2.25} />
    </span>
  );
}

export function RankNobleBadge({ rank = "aspiring", size = "md", showLabel = true }) {
  const config = rankConfig[rank] ?? rankConfig.aspiring;
  const { Icon } = config;
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const pad = size === "sm" ? "px-2 py-0.5" : "px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/80 ${pad} shadow-sm backdrop-blur-md ring-1 ${config.ring}`}
      title={getRankLabel(rank)}
    >
      <span className={`flex items-center justify-center rounded-full bg-white/90 p-0.5 ${config.icon}`}>
        <Icon className={iconSize} strokeWidth={2.25} />
      </span>
      {showLabel && (
        <>
          <span className={`h-1.5 w-1.5 rounded-full ${config.bar}`} />
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700">{getRankLabel(rank)}</span>
        </>
      )}
    </span>
  );
}
