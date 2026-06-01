export const FOUNDER_CONTACT_EMAIL = "joinfounder@gmail.com";
export const RESOURCE_MODERATOR_EMAIL = "zndr.supply@gmail.com";

export function getAdminEmail() {
  return process.env.ADMIN_EMAIL?.trim() || FOUNDER_CONTACT_EMAIL;
}

export function isResourceModeratorEmail(email) {
  return String(email ?? "").trim().toLowerCase() === RESOURCE_MODERATOR_EMAIL.toLowerCase();
}

export function canManageResource({ userEmail, userId, authorId }) {
  if (!userId) return false;
  return isResourceModeratorEmail(userEmail) || userId === authorId;
}
