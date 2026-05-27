import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

export async function POST(request) {
  const body = await request.json();
  const supabase = createAdminSupabaseClient();
  const statusText = body.status === "approved" ? "bestätigt" : "abgelehnt";
  let email = body.email;

  if (!email && body.user_id) {
    const { data } = await supabase.auth.admin.getUserById(body.user_id);
    email = data.user?.email;
  }

  if (!email) {
    return NextResponse.json({ error: "Keine E-Mail-Adresse gefunden." }, { status: 400 });
  }

  await sendEmail({
    to: email,
    subject: `Deine Founder Verifikation wurde ${statusText}`,
    text:
      body.status === "approved"
        ? `Glückwunsch, dein Rang ${body.rank} wurde bestätigt.`
        : `Deine Verifikation wurde abgelehnt. Begründung: ${body.reason ?? "Keine Begründung angegeben."}`,
  });

  return NextResponse.json({ ok: true });
}
