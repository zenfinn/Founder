import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createConversationWithMessage } from "@/lib/direct-messages";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  try {
    const requestId = String(params?.requestId ?? "").trim();
    if (!requestId) {
      return NextResponse.json({ error: "Anfrage-ID fehlt." }, { status: 400 });
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
    const action = String(body.action ?? "").trim();

    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json({ error: "Ungültige Aktion." }, { status: 400 });
    }

    const { data: requestRow, error: fetchError } = await supabase
      .from("message_requests")
      .select("id, sender_id, recipient_id, message, status")
      .eq("id", requestId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!requestRow) {
      return NextResponse.json({ error: "Anfrage nicht gefunden." }, { status: 404 });
    }

    if (requestRow.recipient_id !== user.id) {
      return NextResponse.json({ error: "Nur der Empfänger kann diese Anfrage bearbeiten." }, { status: 403 });
    }

    if (requestRow.status !== "pending") {
      return NextResponse.json({ error: "Diese Anfrage wurde bereits bearbeitet." }, { status: 409 });
    }

    const adminSupabase = createAdminSupabaseClient();

    if (action === "reject") {
      const { error: deleteError } = await adminSupabase.from("message_requests").delete().eq("id", requestId);
      if (deleteError) throw deleteError;
      return NextResponse.json({ ok: true, rejected: true });
    }

    const { conversation } = await createConversationWithMessage(adminSupabase, {
      userA: requestRow.sender_id,
      userB: requestRow.recipient_id,
      senderId: requestRow.sender_id,
      content: requestRow.message,
    });

    await adminSupabase
      .from("message_requests")
      .update({ status: "accepted", responded_at: new Date().toISOString() })
      .eq("id", requestId);

    const { data: recipientProfile } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("id", user.id)
      .maybeSingle();

    const recipientLabel =
      recipientProfile?.display_name?.trim() ||
      (recipientProfile?.username ? `@${recipientProfile.username}` : "Ein Founder");

    await adminSupabase.from("notifications").insert({
      user_id: requestRow.sender_id,
      type: "message_request",
      title: "Nachrichtenanfrage angenommen",
      body: `${recipientLabel} hat deine Anfrage angenommen. Ihr könnt jetzt chatten.`,
      link_url: `/inbox?chat=${conversation.id}`,
    });

    return NextResponse.json({ ok: true, conversationId: conversation.id });
  } catch (error) {
    console.error("PATCH /api/message-requests/[requestId]", error);
    return NextResponse.json({ error: error.message ?? "Anfrage konnte nicht bearbeitet werden." }, { status: 500 });
  }
}
