export const MAX_DISPLAY_RESOURCE_UPVOTES = 40;
export const MAX_DISPLAY_RESOURCE_DOWNVOTES = 4;

/** Baseline upvotes for resources without real votes (newest first). */
const UPVOTES_BY_LIST_INDEX = [34, 27, 21, 16, 12];

function hashResourceIdToRange(resourceId, min, max) {
  const id = String(resourceId ?? "");
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  const span = max - min + 1;
  return min + (hash % span);
}

export function getSeededResourceUpvotes(resourceId, { listIndex = null } = {}) {
  if (listIndex != null && listIndex < UPVOTES_BY_LIST_INDEX.length) {
    return UPVOTES_BY_LIST_INDEX[listIndex];
  }
  return hashResourceIdToRange(resourceId, 8, MAX_DISPLAY_RESOURCE_UPVOTES);
}

export function getSeededResourceDownvotes(resourceId) {
  const bucket = hashResourceIdToRange(resourceId, 1, 100);

  if (bucket <= 18) return 0;
  if (bucket <= 42) return 1;
  if (bucket <= 68) return 2;
  if (bucket <= 88) return 3;

  return MAX_DISPLAY_RESOURCE_DOWNVOTES;
}

export function getDisplayResourceUpvotes(resourceId, actualUpvotes, { listIndex = null } = {}) {
  const seeded = getSeededResourceUpvotes(resourceId, { listIndex });
  const actual = Number(actualUpvotes);
  const safeActual = Number.isFinite(actual) && actual >= 0 ? Math.round(actual) : 0;

  return seeded + safeActual;
}

export function getDisplayResourceDownvotes(resourceId, actualDownvotes) {
  const seeded = getSeededResourceDownvotes(resourceId);
  const actual = Number(actualDownvotes);
  const safeActual = Number.isFinite(actual) && actual >= 0 ? Math.round(actual) : 0;

  return seeded + safeActual;
}

export function withDisplayResourceVotes(resource, { listIndex = null, viewerVote = null } = {}) {
  if (!resource) return resource;

  const upvotes = getDisplayResourceUpvotes(resource.id, resource.upvotes ?? 0, { listIndex });
  const downvotes = getDisplayResourceDownvotes(resource.id, resource.downvotes ?? 0);

  return {
    ...resource,
    upvotes,
    downvotes,
    score: upvotes - downvotes,
    viewerVote,
  };
}
