import { NextResponse } from "next/server";
import { chatWithJarvis, getJarvisOpeningMessage } from "@/lib/founder-jarvis";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ opening: getJarvisOpeningMessage() });
}

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
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const profile = body.profile && typeof body.profile === "object" ? body.profile : {};
    const meetup = body.meetup && typeof body.meetup === "object" ? body.meetup : {};
    const mode = body.mode === "assistant" ? "assistant" : "onboarding";

    const result = await chatWithJarvis({ messages, profile, meetup, mode });

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/onboarding/founder/chat", error);
    return NextResponse.json({ error: error.message ?? "Chat fehlgeschlagen." }, { status: 500 });
  }
}
