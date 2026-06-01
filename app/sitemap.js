import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getBaseUrl } from "@/lib/seo";

export default async function sitemap() {
  const baseUrl = getBaseUrl();

  const staticRoutes = [
    { path: "", priority: 1.0, changeFrequency: "weekly" },
    { path: "/raenge", priority: 0.9, changeFrequency: "monthly" },
    { path: "/raenge/aspiring", priority: 0.7, changeFrequency: "monthly" },
    { path: "/raenge/starter", priority: 0.7, changeFrequency: "monthly" },
    { path: "/raenge/builder", priority: 0.7, changeFrequency: "monthly" },
    { path: "/raenge/scaler", priority: 0.7, changeFrequency: "monthly" },
    { path: "/raenge/elite", priority: 0.7, changeFrequency: "monthly" },
    { path: "/community", priority: 0.8, changeFrequency: "weekly" },
    { path: "/showcases", priority: 0.8, changeFrequency: "weekly" },
    { path: "/events", priority: 0.8, changeFrequency: "weekly" },
    { path: "/mentoren", priority: 0.8, changeFrequency: "weekly" },
    { path: "/leaderboard", priority: 0.7, changeFrequency: "daily" },
    { path: "/register", priority: 0.8, changeFrequency: "monthly" },
    { path: "/impressum", priority: 0.3, changeFrequency: "yearly" },
    { path: "/datenschutz", priority: 0.3, changeFrequency: "yearly" },
    { path: "/agb", priority: 0.3, changeFrequency: "yearly" },
    { path: "/kontakt", priority: 0.4, changeFrequency: "yearly" },
  ];

  const entries = staticRoutes.map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  try {
    const admin = createAdminSupabaseClient();
    const { data: profiles } = await admin
      .from("profiles")
      .select("username, updated_at")
      .eq("public_profile_enabled", true)
      .not("username", "is", null);

    for (const profile of profiles ?? []) {
      if (!profile.username?.trim()) continue;
      entries.push({
        url: `${baseUrl}/u/${profile.username.trim()}`,
        lastModified: profile.updated_at ? new Date(profile.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch (error) {
    console.error("sitemap profiles", error);
  }

  return entries;
}
