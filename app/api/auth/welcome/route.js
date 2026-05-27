import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(request) {
  const body = await request.json();

  await sendEmail({
    to: body.email,
    subject: "Willkommen bei Founder",
    text: `Willkommen bei Founder${body.name ? `, ${body.name}` : ""}. Bitte bestätige deine E-Mail und schließe danach deine Rang-Verifikation ab.`,
  });

  return NextResponse.json({ ok: true });
}
