import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { getAdminEmail } from "@/lib/founder-contact";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Bitte logge dich ein, um ein Event einzureichen." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const locationText = String(body.location_text ?? "").trim();
    const category = String(body.category ?? "").trim();
    const startsAt = body.starts_at ? new Date(body.starts_at).toISOString() : null;

    if (!title) {
      return NextResponse.json({ error: "Bitte gib einen Event-Titel an." }, { status: 400 });
    }

    if (startsAt && Number.isNaN(new Date(startsAt).getTime())) {
      return NextResponse.json({ error: "Ungültiges Datum." }, { status: 400 });
    }

    const adminSupabase = createAdminSupabaseClient();
    const { data: submission, error: insertError } = await adminSupabase
      .from("event_submissions")
      .insert({
        user_id: user.id,
        title,
        description: description || null,
        starts_at: startsAt,
        location_text: locationText || null,
        category: category || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const adminEmail = getAdminEmail();

    await sendEmail({
      to: adminEmail,
      subject: `Neues Event eingereicht: ${title}`,
      text: [
        "Neue Event-Einreichung auf Founder:",
        "",
        `Titel: ${title}`,
        category ? `Kategorie: ${category}` : null,
        startsAt ? `Datum: ${startsAt}` : null,
        locationText ? `Ort: ${locationText}` : null,
        description ? `Beschreibung: ${description}` : null,
        "",
        `Eingereicht von: ${user.email ?? user.id}`,
        `Submission-ID: ${submission.id}`,
        `Admin: ${appUrl}/admin/events`,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    return NextResponse.json({ ok: true, id: submission.id });
  } catch (error) {
    console.error("POST /api/events/submit", error);
    return NextResponse.json({ error: error.message ?? "Event konnte nicht eingereicht werden." }, { status: 500 });
  }
}
