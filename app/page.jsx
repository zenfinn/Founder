import { LandingSlides } from "@/components/landing/LandingSlides";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata("home");

export default async function LandingPage() {
  let memberCount = 500;

  try {
    const admin = createAdminSupabaseClient();
    const { count } = await admin.from("profiles").select("*", { count: "exact", head: true });
    memberCount = Math.max(count ?? 0, 500);
  } catch (error) {
    console.error("landing member count", error);
  }

  return <LandingSlides memberCount={memberCount} />;
}
