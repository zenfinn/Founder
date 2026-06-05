import {
  Bot,
  Briefcase,
  Building2,
  Coins,
  Globe,
  Layout,
  Package,
  ShoppingBag,
  Store,
  TrendingUp,
  Video,
  Youtube,
} from "lucide-react";
import { getCommunityCategoryIconName } from "@/lib/community-categories";

const ICONS = {
  ShoppingBag,
  Package,
  Store,
  Video,
  Bot,
  TrendingUp,
  Coins,
  Youtube,
  Building2,
  Briefcase,
  Layout,
  Globe,
};

export function CommunityCategoryIcon({ category, className = "h-6 w-6", strokeWidth = 2 }) {
  const name = getCommunityCategoryIconName(category);
  const Icon = ICONS[name] ?? Globe;
  return <Icon className={className} strokeWidth={strokeWidth} />;
}
