export const FOUNDER_JARVIS_SESSION_KEY = "founder-jarvis-session-v1";

export function getJarvisSessionKey(userId) {
  return `${FOUNDER_JARVIS_SESSION_KEY}-${userId}`;
}

export function readJarvisSession(userId) {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = window.localStorage.getItem(getJarvisSessionKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      profile: parsed.profile && typeof parsed.profile === "object" ? parsed.profile : {},
    };
  } catch {
    return null;
  }
}

export function writeJarvisSession(userId, { messages = [], profile = {} } = {}) {
  if (typeof window === "undefined" || !userId) return;
  try {
    window.localStorage.setItem(
      getJarvisSessionKey(userId),
      JSON.stringify({
        messages: messages.slice(-80),
        profile,
        updatedAt: Date.now(),
      })
    );
  } catch {
    /* ignore quota */
  }
}

export function clearJarvisSession(userId) {
  if (typeof window === "undefined" || !userId) return;
  try {
    window.localStorage.removeItem(getJarvisSessionKey(userId));
  } catch {
    /* ignore */
  }
}
