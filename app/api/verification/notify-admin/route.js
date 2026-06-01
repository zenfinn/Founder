import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { getAdminEmail } from "@/lib/founder-contact";

export async function POST(request) {
  const body = await request.json();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  await sendEmail({
    to: getAdminEmail(),
    subject: "Neue Founder Verifikations-Anfrage",
    text: `Neue Verifikation für Rang ${body.requested_rank}. Request-ID: ${body.verification_request_id}. Warteschlange: ${appUrl}/admin/verifications`,
  });

  return NextResponse.json({ ok: true });
}
