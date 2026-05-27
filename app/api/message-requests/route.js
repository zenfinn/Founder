import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOwnProfile } from "@/lib/profiles";

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

    const { data: recipient, error: recipientError } = await supabase
      .from("profiles")
      .select("id,display_name,username")
      .eq("id", recipientId)
      .maybeSingle();

    if (recipientError) throw recipientError;
    if (!recipient) {
      return NextResponse.json({ error: "Profil nicht gefunden." }, { status: 404 });
    }

    const senderProfile = await getOwnProfile(supabase, user.id);
    const senderLabel = senderProfile.display_name?.trim() || (senderProfile.username ? `@${senderProfile.username}` : "Ein Founder");

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
    const recipientName = recipient.display_name?.trim() || (recipient.username ? `@${recipient.username}` : "dich");

    await adminSupabase.from("notifications").insert({
      user_id: recipientId,
      type: "message_request",
      title: "Neue Nachrichtenanfrage",
      body: `${senderLabel} möchte dir schreiben: „${message.slice(0, 120)}${message.length > 120 ? "…" : ""}"`,
      link_url: `/members/${user.id}`,
    });

    return NextResponse.json({ id: requestRow.id, recipientName });
  } catch (error) {
    console.error("POST /api/message-requests", error);
    return NextResponse.json({ error: error.message ?? "Anfrage konnte nicht gesendet werden." }, { status: 500 });
  }
}
