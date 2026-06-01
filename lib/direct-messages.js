export const BASIC_DAILY_MESSAGE_REQUEST_LIMIT = 3;

export function orderConversationParticipants(userA, userB) {
  const a = String(userA);
  const b = String(userB);
  return a < b ? { participant_a: a, participant_b: b } : { participant_a: b, participant_b: a };
}

export function getConversationPartner(conversation, userId) {
  if (!conversation) return null;
  return conversation.participant_a === userId ? conversation.participant_b : conversation.participant_a;
}

export async function countMessageRequestsToday(supabase, userId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("message_requests")
    .select("*", { count: "exact", head: true })
    .eq("sender_id", userId)
    .gte("created_at", startOfDay.toISOString());

  if (error) throw error;
  return count ?? 0;
}

export async function findConversationBetween(supabase, userA, userB) {
  const { participant_a, participant_b } = orderConversationParticipants(userA, userB);

  const { data, error } = await supabase
    .from("dm_conversations")
    .select("id, participant_a, participant_b, created_at, last_message_at")
    .eq("participant_a", participant_a)
    .eq("participant_b", participant_b)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getConversationMessages(supabase, conversationId) {
  const { data, error } = await supabase
    .from("dm_messages")
    .select("id, conversation_id, sender_id, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function listInboxData(supabase, userId) {
  const [{ data: conversations, error: conversationsError }, { data: incomingRequests, error: incomingError }, { data: outgoingRequests, error: outgoingError }] =
    await Promise.all([
      supabase
        .from("dm_conversations")
        .select("id, participant_a, participant_b, created_at, last_message_at")
        .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
        .order("last_message_at", { ascending: false }),
      supabase
        .from("message_requests")
        .select("id, sender_id, recipient_id, message, status, created_at")
        .eq("recipient_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase
        .from("message_requests")
        .select("id, sender_id, recipient_id, message, status, created_at")
        .eq("sender_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
    ]);

  if (conversationsError) throw conversationsError;
  if (incomingError) throw incomingError;
  if (outgoingError) throw outgoingError;

  const partnerIds = new Set();
  (conversations ?? []).forEach((conversation) => {
    partnerIds.add(getConversationPartner(conversation, userId));
  });
  (incomingRequests ?? []).forEach((request) => partnerIds.add(request.sender_id));
  (outgoingRequests ?? []).forEach((request) => partnerIds.add(request.recipient_id));

  let profiles = [];
  if (partnerIds.size > 0) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url, current_rank")
      .in("id", [...partnerIds]);

    if (error) throw error;
    profiles = data ?? [];
  }

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  const conversationRows = await Promise.all(
    (conversations ?? []).map(async (conversation) => {
      const partnerId = getConversationPartner(conversation, userId);
      const messages = await getConversationMessages(supabase, conversation.id);
      const lastMessage = messages.at(-1) ?? null;

      return {
        ...conversation,
        partner: profileMap.get(partnerId) ?? { id: partnerId },
        lastMessage,
      };
    })
  );

  return {
    conversations: conversationRows,
    incomingRequests: (incomingRequests ?? []).map((request) => ({
      ...request,
      sender: profileMap.get(request.sender_id) ?? { id: request.sender_id },
    })),
    outgoingRequests: (outgoingRequests ?? []).map((request) => ({
      ...request,
      recipient: profileMap.get(request.recipient_id) ?? { id: request.recipient_id },
    })),
  };
}

export async function createConversationWithMessage(adminSupabase, { userA, userB, senderId, content }) {
  const { participant_a, participant_b } = orderConversationParticipants(userA, userB);

  const existing = await findConversationBetween(adminSupabase, userA, userB);
  const conversation =
    existing ??
    (
      await adminSupabase
        .from("dm_conversations")
        .insert({ participant_a, participant_b })
        .select("id, participant_a, participant_b, created_at, last_message_at")
        .single()
    ).data;

  if (!conversation) {
    throw new Error("Konversation konnte nicht erstellt werden.");
  }

  const { data: message, error: messageError } = await adminSupabase
    .from("dm_messages")
    .insert({
      conversation_id: conversation.id,
      sender_id: senderId,
      content,
    })
    .select("id, conversation_id, sender_id, content, created_at")
    .single();

  if (messageError) throw messageError;

  await adminSupabase
    .from("dm_conversations")
    .update({ last_message_at: message.created_at })
    .eq("id", conversation.id);

  return { conversation, message };
}
