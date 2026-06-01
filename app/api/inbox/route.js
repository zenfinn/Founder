import { NextResponse } from "next/server";
import { listInboxData } from "@/lib/direct-messages";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Bitte logge dich ein." }, { status: 401 });
    }

    const inbox = await listInboxData(supabase, user.id);
    return NextResponse.json(inbox);
  } catch (error) {
    console.error("GET /api/inbox", error);
    return NextResponse.json({ error: error.message ?? "Inbox konnte nicht geladen werden." }, { status: 500 });
  }
}
