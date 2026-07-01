import { NextResponse } from "next/server";
import { FOUNDER_TTS_MODEL, FOUNDER_TTS_VOICE, isOpenAiVoiceConfigured } from "@/lib/openai-voice";
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
    const text = String(body.text ?? "").trim().slice(0, 1200);
    if (!text) {
      return NextResponse.json({ error: "Text fehlt." }, { status: 400 });
    }

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: FOUNDER_TTS_MODEL,
        voice: FOUNDER_TTS_VOICE,
        input: text,
        response_format: "mp3",
        speed: 1.02,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("OpenAI TTS failed", response.status, detail);
      return NextResponse.json({ error: "Sprachausgabe fehlgeschlagen." }, { status: 502 });
    }

    const audio = await response.arrayBuffer();
    return new NextResponse(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("POST /api/onboarding/voice/speak", error);
    return NextResponse.json({ error: error.message ?? "Sprachausgabe fehlgeschlagen." }, { status: 500 });
  }
}
