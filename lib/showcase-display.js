export const MAX_DISPLAY_SHOWCASE_UPVOTES = 30;
export const NEWEST_SHOWCASE_UPVOTES = 23;

function hashShowcaseIdToRange(showcaseId, min, max) {
  const id = String(showcaseId ?? "");
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  const span = max - min + 1;
  return min + (hash % span);
}

export function getSeededShowcaseUpvotes(showcaseId, { isNewest = false } = {}) {
  if (isNewest) return NEWEST_SHOWCASE_UPVOTES;
  return hashShowcaseIdToRange(showcaseId, 0, MAX_DISPLAY_SHOWCASE_UPVOTES);
}

export function getDisplayShowcaseUpvotes(showcaseId, actualUpvotes, { isNewest = false } = {}) {
  const seeded = getSeededShowcaseUpvotes(showcaseId, { isNewest });
  const actual = Number(actualUpvotes);
  const safeActual = Number.isFinite(actual) && actual >= 0 ? Math.round(actual) : 0;

  if (safeActual >= MAX_DISPLAY_SHOWCASE_UPVOTES) return safeActual;
  if (safeActual <= 1) return seeded;
  return Math.min(MAX_DISPLAY_SHOWCASE_UPVOTES, Math.max(seeded, safeActual));
}
