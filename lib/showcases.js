import { canAccessRank } from "@/lib/founder-data";

export const MAX_SHOWCASE_IMAGES = 3;

export function canPostShowcase(rank = "aspiring") {
  return canAccessRank(rank, "starter");
}

export function showcaseImageStoragePath(imageUrl) {
  try {
    const url = new URL(String(imageUrl));
    const marker = "/showcase-images/";
    const index = url.pathname.indexOf(marker);
    if (index === -1) return null;
    return decodeURIComponent(url.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

export function normalizeShowcaseUrl(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function mapShowcaseRow(
  row,
  { commentCount = 0, viewerHasUpvoted = false, author = null, upvotes, previewComments = [] } = {}
) {
  const imageUrls = getShowcaseImageUrls(row);

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    imageUrl: imageUrls[0] ?? row.image_url ?? "",
    imageUrls,
    websiteUrl: row.website_url,
    instagramUrl: row.instagram_url,
    tiktokUrl: row.tiktok_url,
    linkedinUrl: row.linkedin_url,
    upvotes: upvotes ?? row.upvotes ?? 0,
    commentCount,
    previewComments,
    viewerHasUpvoted,
    createdAt: row.created_at,
    author: author
      ? {
          id: author.id,
          displayName: author.display_name ?? author.username ?? "Founder",
          username: author.username,
          avatarUrl: author.avatar_url,
          rank: author.current_rank ?? "aspiring",
        }
      : null,
  };
}
