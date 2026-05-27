import { createClient } from "@supabase/supabase-js";

export const PUBLIC_PROFILE_SELECT =
  "id,display_name,username,company_name,industry,bio,interests,avatar_url,current_rank,instagram_url,tiktok_url,linkedin_url,website_url,twitter_url,trial_started_at";

export const SOCIAL_LINKS = [
  { key: "tiktok_url", label: "TikTok", icon: "tiktok" },
  { key: "instagram_url", label: "Instagram", icon: "instagram" },
  { key: "linkedin_url", label: "LinkedIn", icon: "linkedin" },
  { key: "website_url", label: "Website", icon: "website" },
  { key: "twitter_url", label: "X", icon: "twitter" },
];

export function createPublicSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL oder NEXT_PUBLIC_SUPABASE_ANON_KEY fehlt.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export function getAppBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function formatDisplayName(profile, username) {
  if (profile?.display_name?.trim()) return profile.display_name.trim();
  return username
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function fetchPublicProfile(supabase, username) {
  const { data, error } = await supabase
    .from("profiles")
    .select(PUBLIC_PROFILE_SELECT)
    .eq("username", username)
    .eq("public_profile_enabled", true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchProfilePostCount(supabase, userId) {
  const { data, error } = await supabase.rpc("get_profile_post_count", { p_user_id: userId });
  if (error) {
    console.error("get_profile_post_count", error.message);
    return 0;
  }
  return Number(data ?? 0);
}

export async function fetchActivityLeaderboard(supabase, limit = 20) {
  const { data, error } = await supabase.rpc("get_activity_leaderboard", { p_limit: limit });
  if (error) throw error;
  return data ?? [];
}

export function getISOWeekLabel(date = new Date()) {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utcDate - yearStart) / 86400000 + 1) / 7);
  return { week, year: utcDate.getUTCFullYear() };
}
