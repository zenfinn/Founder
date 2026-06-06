import { getConversationPartner } from "@/lib/direct-messages";

const JUNK_SIGNAL_CONTENT = new Set(["ghggg", "ghgghg", "fftzfz"]);

function isKeyboardMash(text) {
  if (text.length < 4 || text.length > 24) return false;
  if (/\s/.test(text)) return false;
  if (text.length <= 12 && !/[aeiouäöüy]/i.test(text)) return true;
  if (/^(.{2,4})\1{1,}$/.test(text)) return true;
  return false;
}

function isJunkPrioritySignalContent(content) {
  const normalized = String(content ?? "").trim().toLowerCase();
  if (!normalized) return true;
  if (JUNK_SIGNAL_CONTENT.has(normalized)) return true;
  if (isKeyboardMash(normalized)) return true;
  return false;
}

function truncate(text, max = 72) {
  const value = String(text ?? "").replace(/\s+/g, " ").trim();
  if (!value) return "Neue Nachricht";
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function formatSignalTitle({ kind, content, contextLabel }) {
  const preview = truncate(content, 56);
  if (kind === "dm") {
    return contextLabel ? `DM · ${contextLabel}: ${preview}` : `DM · ${preview}`;
  }
  return contextLabel ? `${contextLabel} · ${preview}` : preview;
}

export async function fetchPrioritySignals(supabase, userId, communityGroupIds = []) {
  const signals = [];

  if (communityGroupIds.length > 0) {
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("id, content, created_at, group_id, groups(name)")
      .in("group_id", communityGroupIds)
      .eq("type", "message")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!postsError) {
      for (const post of posts ?? []) {
        if (isJunkPrioritySignalContent(post.content)) continue;
        signals.push({
          id: `post-${post.id}`,
          title: formatSignalTitle({
            kind: "community",
            content: post.content,
            contextLabel: post.groups?.name ?? "Community",
          }),
          href: `/community/${post.group_id}?tab=chat`,
          createdAt: post.created_at,
        });
      }
    }
  }

  const { data: conversations, error: conversationsError } = await supabase
    .from("dm_conversations")
    .select("id, participant_a, participant_b, last_message_at")
    .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
    .not("last_message_at", "is", null)
    .order("last_message_at", { ascending: false })
    .limit(20);

  if (!conversationsError && conversations?.length) {
    const partnerIds = conversations.map((conversation) => getConversationPartner(conversation, userId)).filter(Boolean);

    let profileMap = new Map();
    if (partnerIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, username")
        .in("id", partnerIds);
      profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    }

    const messageResults = await Promise.all(
      conversations.map(async (conversation) => {
        const { data: message } = await supabase
          .from("dm_messages")
          .select("content, created_at")
          .eq("conversation_id", conversation.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!message || isJunkPrioritySignalContent(message.content)) return null;

        const partnerId = getConversationPartner(conversation, userId);
        const partner = profileMap.get(partnerId);
        const partnerLabel = partner?.display_name ?? (partner?.username ? `@${partner.username}` : "Kontakt");

        return {
          id: `dm-${conversation.id}`,
          title: formatSignalTitle({
            kind: "dm",
            content: message.content,
            contextLabel: partnerLabel,
          }),
          href: `/inbox?chat=${conversation.id}`,
          createdAt: message.created_at,
        };
      })
    );

    signals.push(...messageResults.filter(Boolean));
  }

  return signals
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);
}

export function formatPrioritySignalTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Gerade eben";
  if (diffMinutes < 60) return `vor ${diffMinutes} Min.`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `vor ${diffHours} Std.`;

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
