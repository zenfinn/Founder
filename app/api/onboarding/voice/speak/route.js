import { NextResponse } from "next/server";
import { synthesizeFounderSpeech } from "@/lib/founder-tts";
import { isOpenAiVoiceConfigured } from "@/lib/openai-voice";
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
      return NextResponse.json({ error: "Bitte logge dich ein." }, { status: 401 });
    }

    if (!isOpenAiVoiceConfigured()) {
      return NextResponse.json({ error: "Founder Voice ist nicht konfiguriert." }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const text = String(body.text ?? "").trim();
    if (!text) {
      return NextResponse.json({ error: "Text fehlt." }, { status: 400 });
    }

    const { audio, engine, contentType } = await synthesizeFounderSpeech(text, process.env.OPENAI_API_KEY);

    return new NextResponse(audio, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store",
        "X-Founder-Tts-Engine": engine,
      },
    });
  } catch (error) {
    console.error("POST /api/onboarding/voice/speak", error);
    return NextResponse.json({ error: error.message ?? "Sprachausgabe fehlgeschlagen." }, { status: 500 });
  }
}
