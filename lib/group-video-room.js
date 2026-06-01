export function buildGroupVideoRoomUrl(group) {
  const slug = (group?.slug ?? group?.category ?? group?.name ?? "group")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const id = String(group?.id ?? "room").replace(/-/g, "").slice(0, 12);
  return `https://meet.jit.si/Founder-${slug}-${id}`;
}
