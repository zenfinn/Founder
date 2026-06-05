export const MAX_DISPLAY_SHOWCASE_UPVOTES = 40;
export const MAX_DISPLAY_SHOWCASE_COMMENTS = 3;

/** Baseline likes for showcases without real votes (newest first). */
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

  return seeded + safeActual;
}

export function getSeededShowcaseComments(showcaseId) {
  const setIndex = hashShowcaseIdToRange(showcaseId, 0, SEEDED_COMMENT_SETS.length - 1);
  const texts = SEEDED_COMMENT_SETS[setIndex];
  const count = Math.min(MAX_DISPLAY_SHOWCASE_COMMENTS, Math.max(1, 1 + hashShowcaseIdToRange(showcaseId, 0, 1)));

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
  const seededCount = getSeededShowcaseComments(showcaseId).length;
  const actual = Number(actualCommentCount);
  const safeActual = Number.isFinite(actual) && actual > 0 ? Math.round(actual) : 0;

  return seededCount + safeActual;
}

export function getDisplayShowcaseComments(showcaseId, realComments = []) {
  const seeded = getSeededShowcaseComments(showcaseId);
  const reals = (realComments ?? []).filter((comment) => !comment.isSeeded);

  if (reals.length === 0) return seeded;
  return [...seeded, ...reals];
}

export function getShowcasePreviewComments(showcaseId) {
  return getSeededShowcaseComments(showcaseId).slice(0, 2);
}
