import { groupResources as founderGroupResources } from "@/lib/founder-data";
import { withDisplayResourceVotes } from "@/lib/resource-display";

const legacyCategoryToType = {
  "Discord-Gruppen": "discord_communities",
  "Telegram-Kanäle": "discord_communities",
  "YouTube-Kanäle": "youtube_media",
  Kurse: "templates_blueprints",
  Tools: "saas_ai_tools",
};

function mapLegacyResourceRow(row, group, { listIndex = null, source = "legacy" } = {}) {
  const groupId = group?.id ?? null;

  return withDisplayResourceVotes(
    {
      id: `${source}-${row.id}`,
      group_id: groupId,
      title: row.title,
      url: row.external_url ?? "",
      type: legacyCategoryToType[row.category] ?? "saas_ai_tools",
      user_id: row.submitted_by ?? null,
      created_at: row.created_at ?? new Date(0).toISOString(),
      upvotes: 0,
      downvotes: 0,
      score: 0,
      group: group
        ? { id: group.id, name: group.name, category: group.category, slug: group.slug }
        : null,
      legacy: true,
    },
    { listIndex }
  );
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

function sortTools(tools) {
  return [...tools].sort(
    (left, right) => right.score - left.score || new Date(right.created_at) - new Date(left.created_at)
  );
}

export async function fetchLegacyToolsForGroup(supabase, group) {
  if (!group?.slug) return [];

  const { data, error } = await supabase
    .from("group_resources")
    .select("id, group_slug, title, description, category, external_url, status, submitted_by, created_at")
    .eq("group_slug", group.slug)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const dbRows = (data ?? []).map((row, index) => mapLegacyResourceRow(row, group, { listIndex: index, source: "db" }));

  if (dbRows.length > 0) return dbRows;

  return founderGroupResources
    .filter((row) => row.group_slug === group.slug && row.status === "approved")
    .map((row, index) =>
      mapLegacyResourceRow(
        {
          id: row.id,
          title: row.title,
          category: row.category,
          external_url: row.external_url,
          created_at: new Date(0).toISOString(),
        },
        group,
        { listIndex: index, source: "seed" }
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
  const fromDb = (legacyRows ?? []).map((row, index) => {
    const group = groupsBySlug.get(row.group_slug) ?? null;
    return mapLegacyResourceRow(row, group, { listIndex: index, source: "db" });
  });

  if (fromDb.length > 0) return fromDb;

  return founderGroupResources
    .filter((row) => row.status === "approved")
    .map((row, index) => {
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
        { listIndex: index, source: "seed" }
      );
    })
    .filter((row) => row.group_id);
}

export function mergeCommunityTools(postTools, legacyTools) {
  return sortTools(dedupeTools([...postTools, ...legacyTools]));
}
