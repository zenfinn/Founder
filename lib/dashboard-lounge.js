export const FOUNDER_LOUNGE_SLUG = "gruender-lounge";

export const FOUNDER_LOUNGE_FALLBACK = {
  slug: FOUNDER_LOUNGE_SLUG,
  name: "Alle Gründer",
  description: "Der globale Chat für alle Founder — branchenübergreifend, für jedes Mitglied.",
  category: "Gründer Lounge",
  min_rank: "aspiring",
  requires_founder_pro: false,
};

export function isGlobalLounge(group) {
  const slug = String(group?.slug ?? "").toLowerCase();
  const category = String(group?.category ?? "").toLowerCase();
  return slug === FOUNDER_LOUNGE_SLUG || category === "gründer lounge";
}

export async function fetchGlobalLoungeGroup(supabase) {
  const { data, error } = await supabase
    .from("groups")
    .select("id,name,category,slug,description,min_rank,requires_founder_pro,member_count")
    .eq("slug", FOUNDER_LOUNGE_SLUG)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

/** Every member belongs in the global lounge — does not count against Basic community limits. */
export async function ensureGlobalLoungeMembership(supabase, userId) {
  if (!userId) return null;

  const group = await fetchGlobalLoungeGroup(supabase);
  if (!group?.id) return null;

  const { data: existing } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", group.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return group;

  const { error } = await supabase.from("group_members").insert({ group_id: group.id, user_id: userId });
  if (error && error.code !== "23505") throw error;

  return group;
}
