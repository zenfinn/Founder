export const MAX_DISPLAY_RESOURCE_UPVOTES = 40;
export const MAX_DISPLAY_RESOURCE_DOWNVOTES = 4;

/** Upvotes for the first resources in a list (newest first). */
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

export function getSeededResourceDownvotes(resourceId, displayUpvotes) {
  const bucket = hashResourceIdToRange(resourceId, 1, 100);
  const upvotes = Math.max(1, Number(displayUpvotes) || 1);

  if (bucket <= 18) return 0;
  if (bucket <= 42) return 1;
  if (bucket <= 68) return 2;
  if (bucket <= 88) return 3;

  return Math.min(MAX_DISPLAY_RESOURCE_DOWNVOTES, Math.max(1, Math.round(upvotes * 0.1)));
}

export function getDisplayResourceUpvotes(resourceId, actualUpvotes, { listIndex = null } = {}) {
  const seeded = getSeededResourceUpvotes(resourceId, { listIndex });
  const actual = Number(actualUpvotes);
  const safeActual = Number.isFinite(actual) && actual >= 0 ? Math.round(actual) : 0;

  if (safeActual >= MAX_DISPLAY_RESOURCE_UPVOTES) return safeActual;
  if (safeActual <= 1) return seeded;
  return Math.min(MAX_DISPLAY_RESOURCE_UPVOTES, Math.max(seeded, safeActual));
}

export function getDisplayResourceDownvotes(resourceId, actualDownvotes, displayUpvotes) {
  const seeded = getSeededResourceDownvotes(resourceId, displayUpvotes);
  const actual = Number(actualDownvotes);
  const safeActual = Number.isFinite(actual) && actual >= 0 ? Math.round(actual) : 0;

  if (safeActual >= MAX_DISPLAY_RESOURCE_DOWNVOTES) return safeActual;
  if (safeActual <= 1) return seeded;

  const blended = Math.max(seeded, safeActual);
  const cap = Math.max(seeded, Math.min(MAX_DISPLAY_RESOURCE_DOWNVOTES, Math.round(displayUpvotes * 0.15)));
  return Math.min(cap, blended);
}

export function withDisplayResourceVotes(resource, { listIndex = null } = {}) {
  if (!resource) return resource;

  const upvotes = getDisplayResourceUpvotes(resource.id, resource.upvotes ?? 0, { listIndex });
  const downvotes = getDisplayResourceDownvotes(resource.id, resource.downvotes ?? 0, upvotes);

  return {
    ...resource,
    upvotes,
    downvotes,
    score: upvotes - downvotes,
  };
}
