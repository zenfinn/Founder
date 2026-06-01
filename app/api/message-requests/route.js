import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOwnProfile } from "@/lib/profiles";
import {
  BASIC_DAILY_MESSAGE_REQUEST_LIMIT,
  countMessageRequestsToday,
  findConversationBetween,
} from "@/lib/direct-messages";
import { isFounderPro } from "@/lib/membership";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Bitte logge dich ein." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const recipientId = String(body.recipientId ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!recipientId) {
      return NextResponse.json({ error: "Empfänger fehlt." }, { status: 400 });
    }

    if (recipientId === user.id) {
      return NextResponse.json({ error: "Du kannst dir selbst keine Anfrage senden." }, { status: 400 });
    }

    if (message.length < 1 || message.length > 500) {
      return NextResponse.json({ error: "Nachricht muss zwischen 1 und 500 Zeichen lang sein." }, { status: 400 });
    }

    const existingConversation = await findConversationBetween(supabase, user.id, recipientId);
    if (existingConversation) {
      return NextResponse.json({
        error: "Ihr habt bereits einen aktiven Chat.",
        conversationId: existingConversation.id,
      }, { status: 409 });
    }

    const senderProfile = await getOwnProfile(supabase, user.id);

    if (!isFounderPro(senderProfile)) {
      const sentToday = await countMessageRequestsToday(supabase, user.id);
      if (sentToday >= BASIC_DAILY_MESSAGE_REQUEST_LIMIT) {
        return NextResponse.json(
          {
            error: `Basic-Mitglieder können maximal ${BASIC_DAILY_MESSAGE_REQUEST_LIMIT} Nachrichtenanfragen pro Tag senden. Upgrade auf Founder Pro für unbegrenzte Anfragen.`,
            limitReached: true,
          },
          { status: 429 }
        );
      }
    }

    const { data: recipient, error: recipientError } = await supabase
      .from("profiles")
      .select("id,display_name,username")
      .eq("id", recipientId)
      .maybeSingle();

    if (recipientError) throw recipientError;
    if (!recipient) {
      return NextResponse.json({ error: "Profil nicht gefunden." }, { status: 404 });
    }

    const senderLabel =
      senderProfile.display_name?.trim() || (senderProfile.username ? `@${senderProfile.username}` : "Ein Founder");

    const { data: requestRow, error: insertError } = await supabase
      .from("message_requests")
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        message,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ error: "Du hast bereits eine offene Anfrage an diese Person gesendet." }, { status: 409 });
      }
      throw insertError;
    }

    const adminSupabase = createAdminSupabaseClient();

    await adminSupabase.from("notifications").insert({
      user_id: recipientId,
      type: "message_request",
      title: "Neue Nachrichtenanfrage",
      body: `${senderLabel} möchte dir schreiben: „${message.slice(0, 120)}${message.length > 120 ? "…" : ""}"`,
      link_url: `/inbox?requests=1`,
    });

    return NextResponse.json({ id: requestRow.id, recipientName: recipient.display_name?.trim() || recipient.username || "Mitglied" });
  } catch (error) {
    console.error("POST /api/message-requests", error);
    return NextResponse.json({ error: error.message ?? "Anfrage konnte nicht gesendet werden." }, { status: 500 });
  }
}
