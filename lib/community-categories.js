import { communityChannels } from "@/lib/founder-data";

/** Haupt-Kategorien für das Dashboard (Above the Fold) */
export const DASHBOARD_MAIN_CATEGORY_SLUGS = [
  "real-estate",
  "traditional-services",
  "web-design",
  "e-commerce",
];

export const communityCategoryStyles = {
  Reselling: "bg-amber-50 text-amber-700",
  Dropshipping: "bg-blue-50 text-blue-700",
  "E-Commerce": "bg-indigo-50 text-indigo-700",
  "TikTok Creator": "bg-fuchsia-50 text-fuchsia-700",
  "TikTok Shop": "bg-pink-50 text-pink-700",
  "KI Creator": "bg-violet-50 text-violet-700",
  Trading: "bg-red-50 text-red-700",
  "Memecoin Trading": "bg-orange-50 text-orange-700",
  "YouTube Automation": "bg-rose-50 text-rose-700",
  "Real Estate": "bg-emerald-50 text-emerald-700",
  "Traditional Services": "bg-sky-50 text-sky-700",
  "Web Design": "bg-violet-50 text-violet-700",
  "Founder Pro": "bg-founder-50 text-founder-700",
};

export const communityCategoryIconNames = {
  Reselling: "ShoppingBag",
  Dropshipping: "Package",
  "E-Commerce": "Store",
  "TikTok Creator": "Video",
  "TikTok Shop": "ShoppingBag",
  "KI Creator": "Bot",
  Trading: "TrendingUp",
  "Memecoin Trading": "Coins",
  "YouTube Automation": "Youtube",
  "Real Estate": "Building2",
  "Traditional Services": "Briefcase",
  "Web Design": "Layout",
};

export function getCommunityCategoryIconName(category) {
  return communityCategoryIconNames[category] ?? "Globe";
}

export function getCommunityCategoryStyle(category) {
  return communityCategoryStyles[category] ?? "bg-slate-100 text-slate-700";
}

export function getDashboardMainCategories() {
  return DASHBOARD_MAIN_CATEGORY_SLUGS.map((slug) =>
    communityChannels.find((channel) => channel.slug === slug)
  ).filter(Boolean);
}
