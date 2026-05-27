import { Crown, Flame, Gem, Sprout, Zap } from "lucide-react";
import { getRankLabel } from "@/lib/founder-data";

const rankConfig = {
  aspiring: {
    Icon: Sprout,
    badge: "bg-slate-100 text-slate-700 ring-slate-200",
    icon: "text-slate-500",
  },
  starter: {
    Icon: Zap,
    badge: "bg-blue-50 text-blue-700 ring-blue-200",
    icon: "text-rank-starter",
  },
  builder: {
    Icon: Flame,
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    icon: "text-rank-builder",
  },
  scaler: {
    Icon: Gem,
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    icon: "text-rank-scaler",
  },
  elite: {
    Icon: Crown,
    badge: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200",
    icon: "text-rank-elite",
  },
};

export function PublicRankBadge({ rank = "aspiring", size = "md", showIcon = true, showLabel = true }) {
  const config = rankConfig[rank] ?? rankConfig.aspiring;
  const { Icon } = config;
  const textSize = size === "lg" ? "text-sm px-4 py-1.5" : size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-3 py-1";
  const iconSize = size === "lg" ? "h-4 w-4" : size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold ring-1 ${config.badge} ${textSize}`}
      title={getRankLabel(rank)}
    >
      {showIcon && <Icon className={`${iconSize} ${config.icon}`} strokeWidth={2.25} />}
      {showLabel && getRankLabel(rank)}
    </span>
  );
}
