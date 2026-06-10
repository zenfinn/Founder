import { groupResources as founderGroupResources } from "@/lib/founder-data";
import { withDisplayResourceVotes } from "@/lib/resource-display";

const GROUP_SELECT = "id, name, category, slug, description, min_rank, requires_founder_pro, member_count";

const legacyCategoryToType = {
  "Discord-Gruppen": "discord_communities",
  "Telegram-Kanäle": "discord_communities",
  "YouTube-Kanäle": "youtube_media",
  Kurse: "templates_blueprints",
  Tools: "saas_ai_tools",
};

export function resolveLegacySlug(group) {
  if (group?.slug) return group.slug;

  const category = String(group?.category ?? "").toLowerCase();
  const name = String(group?.name ?? "").toLowerCase();

  if (category.includes("drop")) return "dropshipping";
  if (category.includes("resell")) return "reselling";
  if (category.includes("commerce") || category.includes("e-commerce")) return "e-commerce";
  if (category.includes("tiktok") && category.includes("shop")) return "tiktok-shop";
  if (category.includes("tiktok")) return "tiktok-creator";
  if (category.includes("ki")) return "ki-creator";
  if (category.includes("trading") && category.includes("meme")) return "memecoin-trading";
  if (category.includes("trading")) return "trading";
  if (category.includes("youtube")) return "youtube-automation";
  if (category.includes("real estate") || category.includes("immobilien")) return "real-estate";
  if (category.includes("web design")) return "web-design";
  if (category.includes("traditional") || category.includes("klassische")) return "traditional-services";
  if (category.includes("amazon")) return "amazon-fba";
  if (category.includes("digital")) return "digital-business";
  if (category.includes("founder pro")) return "founder-pro";

  return name.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function resolveCommunityToolScope(supabase, group) {
  if (!group) return { groupIds: [], slug: "", category: "", canonical: null };

  const groupIds = new Set();
  if (group.id) groupIds.add(group.id);

  const slug = resolveLegacySlug(group);
  const category = group.category ?? "";

  const lookups = [];
  if (slug) lookups.push(supabase.from("groups").select(GROUP_SELECT).eq("slug", slug));
  if (category) lookups.push(supabase.from("groups").select(GROUP_SELECT).eq("category", category));

  const results = await Promise.all(lookups.map((query) => query));
  const matches = [];

  for (const result of results) {
    if (result.error) throw result.error;
    matches.push(...(result.data ?? []));
  }

  for (const match of matches) {
    if (match.id) groupIds.add(match.id);
  }

  const canonical =
    matches.find((row) => row.slug === slug) ??
    matches.find((row) => row.category === category) ??
    matches.sort((a, b) => (b.member_count ?? 0) - (a.member_count ?? 0))[0] ??
    group;

  return {
    groupIds: [...groupIds],
    slug,
    category,
    canonical,
  };
}

function mapLegacyResourceRow(row, group, { source = "legacy" } = {}) {
  const groupId = group?.id ?? null;

  return {
    id: `${source}-${row.id}`,
    group_id: groupId,
    title: row.title,
    url: row.external_url ?? "",
    type: legacyCategoryToType[row.category] ?? "saas_ai_tools",
    user_id: row.submitted_by ?? null,
    created_at: row.created_at ?? new Date(0).toISOString(),
    actualUpvotes: 0,
    actualDownvotes: 0,
    upvotes: 0,
    downvotes: 0,
    score: 0,
    group: group
      ? { id: group.id, name: group.name, category: group.category, slug: group.slug }
      : null,
    legacy: true,
  };
}

function dedupeTools(tools) {
  const seen = new Set();

  return tools.filter((tool) => {
    const key = `${tool.title?.trim().toLowerCase()}::${tool.url?.trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sortToolsByActualVotes(tools) {
  return [...tools].sort(
    (left, right) =>
      right.score - left.score || new Date(right.created_at) - new Date(left.created_at)
  );
}

export function mergeCommunityTools(postTools, legacyTools) {
  const deduped = dedupeTools([...postTools, ...legacyTools]);
  const sorted = sortToolsByActualVotes(deduped);

  return sorted.map((tool, index) =>
    withDisplayResourceVotes(
      {
        ...tool,
        upvotes: tool.actualUpvotes ?? tool.upvotes ?? 0,
        downvotes: tool.actualDownvotes ?? tool.downvotes ?? 0,
        score: (tool.actualUpvotes ?? tool.upvotes ?? 0) - (tool.actualDownvotes ?? tool.downvotes ?? 0),
      },
      { listIndex: index, viewerVote: tool.viewerVote ?? null }
    )
  );
}

export async function fetchLegacyToolsForGroup(supabase, group) {
  const slug = resolveLegacySlug(group);
  if (!slug) return [];

  const { data, error } = await supabase
    .from("group_resources")
    .select("id, group_slug, title, description, category, external_url, status, submitted_by, created_at")
    .eq("group_slug", slug)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const canonical = group?.id ? group : { ...group, slug };

  const dbRows = (data ?? []).map((row) => mapLegacyResourceRow(row, canonical, { source: "db" }));

  if (dbRows.length > 0) return dbRows;

  return founderGroupResources
    .filter((row) => row.group_slug === slug && row.status === "approved")
    .map((row) =>
      mapLegacyResourceRow(
        {
          id: row.id,
          title: row.title,
          category: row.category,
          external_url: row.external_url,
          created_at: new Date(0).toISOString(),
        },
        canonical,
        { source: "seed" }
      )
    );
}

export async function fetchAllLegacyTools(supabase) {
  const [{ data: groups, error: groupsError }, { data: legacyRows, error: legacyError }] = await Promise.all([
    supabase.from("groups").select("id, name, category, slug"),
    supabase
      .from("group_resources")
      .select("id, group_slug, title, description, category, external_url, status, submitted_by, created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
  ]);

  if (groupsError) throw groupsError;
  if (legacyError) throw legacyError;

  const groupsBySlug = new Map((groups ?? []).map((group) => [group.slug, group]));
  const fromDb = (legacyRows ?? []).map((row) => {
    const group = groupsBySlug.get(row.group_slug) ?? null;
    return mapLegacyResourceRow(row, group, { source: "db" });
  });

  if (fromDb.length > 0) return fromDb;

  return founderGroupResources
    .filter((row) => row.status === "approved")
    .map((row) => {
      const group = groupsBySlug.get(row.group_slug) ?? null;
      return mapLegacyResourceRow(
        {
          id: row.id,
          title: row.title,
          category: row.category,
          external_url: row.external_url,
          created_at: new Date(0).toISOString(),
        },
        group,
        { source: "seed" }
      );
    })
    .filter((row) => row.group_id);
}

export function postMatchesCommunityScope(row, scope) {
  const linked = row.groups ?? null;
  const linkedSlug = linked?.slug?.toLowerCase() ?? "";
  const linkedCategory = linked?.category?.toLowerCase() ?? "";
  const linkedName = linked?.name?.toLowerCase() ?? "";
  const scopeSlug = scope.slug?.toLowerCase() ?? "";
  const scopeCategory = scope.category?.toLowerCase() ?? "";
  const scopeName = scope.canonical?.name?.toLowerCase() ?? "";

  if (scope.groupIds.includes(row.group_id)) return true;
  if (scopeSlug && linkedSlug === scopeSlug) return true;
  if (scopeCategory && linkedCategory === scopeCategory) return true;
  if (scopeName && linkedName === scopeName) return true;

  return false;
}
