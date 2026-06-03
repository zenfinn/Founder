import { canAccessRank } from "@/lib/founder-data";

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

export function mapShowcaseRow(row, { commentCount = 0, viewerHasUpvoted = false, author = null } = {}) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    websiteUrl: row.website_url,
    instagramUrl: row.instagram_url,
    tiktokUrl: row.tiktok_url,
    linkedinUrl: row.linkedin_url,
    upvotes: row.upvotes ?? 0,
    commentCount,
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
