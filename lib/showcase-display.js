export const MAX_DISPLAY_SHOWCASE_UPVOTES = 40;
export const MAX_DISPLAY_SHOWCASE_COMMENTS = 3;

/** Likes for the first three showcases (newest first). */
const UPVOTES_BY_LIST_INDEX = [34, 27, 19];

const SEEDED_COMMENT_SETS = [
  ["Sehr geile Idee!", "Mach weiter so!"],
  ["Krasse Idee — weiter so!"],
  ["Sehr geiles Projekt!", "Mach weiter so!"],
];

function hashShowcaseIdToRange(showcaseId, min, max) {
  const id = String(showcaseId ?? "");
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  const span = max - min + 1;
  return min + (hash % span);
}

export function getSeededShowcaseUpvotes(showcaseId, { listIndex = null } = {}) {
  if (listIndex != null && listIndex < UPVOTES_BY_LIST_INDEX.length) {
    return UPVOTES_BY_LIST_INDEX[listIndex];
  }
  return hashShowcaseIdToRange(showcaseId, 8, MAX_DISPLAY_SHOWCASE_UPVOTES);
}

export function getDisplayShowcaseUpvotes(showcaseId, actualUpvotes, { listIndex = null } = {}) {
  const seeded = getSeededShowcaseUpvotes(showcaseId, { listIndex });
  const actual = Number(actualUpvotes);
  const safeActual = Number.isFinite(actual) && actual >= 0 ? Math.round(actual) : 0;

  if (safeActual >= MAX_DISPLAY_SHOWCASE_UPVOTES) return safeActual;
  if (safeActual <= 1) return seeded;
  return Math.min(MAX_DISPLAY_SHOWCASE_UPVOTES, Math.max(seeded, safeActual));
}

export function getSeededShowcaseComments(showcaseId) {
  const setIndex = hashShowcaseIdToRange(showcaseId, 0, SEEDED_COMMENT_SETS.length - 1);
  const texts = SEEDED_COMMENT_SETS[setIndex];
  const count = Math.min(MAX_DISPLAY_SHOWCASE_COMMENTS, Math.max(1, 1 + (hashShowcaseIdToRange(showcaseId, 0, 1))));

  return texts.slice(0, count).map((content, index) => ({
    id: `seed-${showcaseId}-${index}`,
    content,
    createdAt: new Date(Date.now() - (index + 1) * 36 * 60 * 60 * 1000).toISOString(),
    isSeeded: true,
    author: {
      id: "seeded",
      displayName: "Founder",
      avatarUrl: "",
      rank: "builder",
    },
  }));
}

export function getDisplayCommentCount(showcaseId, actualCommentCount = 0) {
  const actual = Number(actualCommentCount);
  const safeActual = Number.isFinite(actual) && actual > 0 ? Math.round(actual) : 0;
  if (safeActual > 0) return Math.min(MAX_DISPLAY_SHOWCASE_COMMENTS, safeActual);
  return getSeededShowcaseComments(showcaseId).length;
}

export function getDisplayShowcaseComments(showcaseId, realComments = []) {
  if (realComments.length > 0) {
    return realComments.slice(0, MAX_DISPLAY_SHOWCASE_COMMENTS);
  }
  return getSeededShowcaseComments(showcaseId).slice(0, MAX_DISPLAY_SHOWCASE_COMMENTS);
}

export function getShowcasePreviewComments(showcaseId, actualCommentCount = 0) {
  if (Number(actualCommentCount) > 0) return [];
  return getSeededShowcaseComments(showcaseId).slice(0, 2);
}
