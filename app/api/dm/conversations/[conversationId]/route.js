import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getConversationMessages } from "@/lib/direct-messages";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  try {
    const conversationId = String(params?.conversationId ?? "").trim();
    if (!conversationId) {
      return NextResponse.json({ error: "Konversations-ID fehlt." }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Bitte logge dich ein." }, { status: 401 });
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("dm_conversations")
      .select("id, participant_a, participant_b")
      .eq("id", conversationId)
      .maybeSingle();

    if (conversationError) throw conversationError;
    if (!conversation) {
      return NextResponse.json({ error: "Konversation nicht gefunden." }, { status: 404 });
    }

    if (conversation.participant_a !== user.id && conversation.participant_b !== user.id) {
      return NextResponse.json({ error: "Kein Zugriff auf diese Konversation." }, { status: 403 });
    }

    const messages = await getConversationMessages(supabase, conversationId);
    const partnerId = conversation.participant_a === user.id ? conversation.participant_b : conversation.participant_a;

    const { data: partner } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url, current_rank")
      .eq("id", partnerId)
      .maybeSingle();

    return NextResponse.json({ conversation, partner, messages });
  } catch (error) {
    console.error("GET /api/dm/conversations/[conversationId]", error);
    return NextResponse.json({ error: error.message ?? "Chat konnte nicht geladen werden." }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const conversationId = String(params?.conversationId ?? "").trim();
    if (!conversationId) {
      return NextResponse.json({ error: "Konversations-ID fehlt." }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Bitte logge dich ein." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const content = String(body.content ?? "").trim();

    if (content.length < 1 || content.length > 2000) {
      return NextResponse.json({ error: "Nachricht muss zwischen 1 und 2000 Zeichen lang sein." }, { status: 400 });
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("dm_conversations")
      .select("id, participant_a, participant_b")
      .eq("id", conversationId)
      .maybeSingle();

    if (conversationError) throw conversationError;
    if (!conversation) {
      return NextResponse.json({ error: "Konversation nicht gefunden." }, { status: 404 });
    }

    if (conversation.participant_a !== user.id && conversation.participant_b !== user.id) {
      return NextResponse.json({ error: "Kein Zugriff auf diese Konversation." }, { status: 403 });
    }

    const { data: message, error: insertError } = await supabase
      .from("dm_messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
      })
      .select("id, conversation_id, sender_id, content, created_at")
      .single();

    if (insertError) throw insertError;

    const adminSupabase = createAdminSupabaseClient();
    await adminSupabase.from("dm_conversations").update({ last_message_at: message.created_at }).eq("id", conversationId);

    const recipientId = conversation.participant_a === user.id ? conversation.participant_b : conversation.participant_a;
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("id", user.id)
      .maybeSingle();

    const senderLabel =
      senderProfile?.display_name?.trim() || (senderProfile?.username ? `@${senderProfile.username}` : "Ein Founder");

    await adminSupabase.from("notifications").insert({
      user_id: recipientId,
      type: "chat_message",
      title: "Neue Direktnachricht",
      body: `${senderLabel}: ${content.slice(0, 120)}${content.length > 120 ? "…" : ""}`,
      link_url: `/inbox?chat=${conversationId}`,
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("POST /api/dm/conversations/[conversationId]", error);
    return NextResponse.json({ error: error.message ?? "Nachricht konnte nicht gesendet werden." }, { status: 500 });
  }
}
