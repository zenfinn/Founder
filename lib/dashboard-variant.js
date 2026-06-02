export const DASHBOARD_VARIANT_KEY = "founder_dashboard_variant";
export const DASHBOARD_VARIANTS = ["bento", "classic"];

export function readDashboardVariant() {
  if (typeof window === "undefined") return "bento";
  const stored = window.localStorage.getItem(DASHBOARD_VARIANT_KEY);
  return DASHBOARD_VARIANTS.includes(stored) ? stored : "bento";
}

export function writeDashboardVariant(variant) {
  if (typeof window === "undefined") return;
  if (!DASHBOARD_VARIANTS.includes(variant)) return;
  window.localStorage.setItem(DASHBOARD_VARIANT_KEY, variant);
}

export function resolveDashboardVariant(initialVariant) {
  if (initialVariant === "classic" || initialVariant === "bento") return initialVariant;
  return readDashboardVariant();
}
