export const COCKPIT_ROUTE_PREFIXES = [
  "/dashboard",
  "/community",
  "/resources",
  "/showcases",
  "/mentoren",
  "/events",
  "/inbox",
  "/leaderboard",
  "/raenge",
  "/profile",
  "/affiliate",
  "/notifications",
  "/payment",
  "/members",
  "/jarvis",
  "/onboarding",
];

export function isCockpitPath(pathname = "") {
  return COCKPIT_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
