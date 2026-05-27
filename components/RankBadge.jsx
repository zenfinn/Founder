import { getRankLabel } from "@/lib/founder-data";

const badgeStyles = {
  aspiring: "bg-slate-100 text-slate-700",
  starter: "bg-blue-50 text-blue-700",
  builder: "bg-emerald-50 text-emerald-700",
  scaler: "bg-amber-50 text-amber-700",
  elite: "bg-fuchsia-50 text-fuchsia-700",
};

export function RankBadge({ rank = "aspiring", prefix = "ab" }) {
  return (
    <span className={`inline-flex animate-pulse rounded-full px-3 py-1 text-xs font-bold ${badgeStyles[rank] ?? badgeStyles.aspiring}`}>
      {prefix} {getRankLabel(rank)}
    </span>
  );
}
