import { NextResponse } from "next/server";
import { FOUNDER_STT_MODEL, isOpenAiVoiceConfigured } from "@/lib/openai-voice";
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

    const formData = await request.formData();
    const audio = formData.get("audio");
    if (!audio || typeof audio === "string") {
      return NextResponse.json({ error: "Audio fehlt." }, { status: 400 });
    }

    if (audio.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Audio ist zu groß." }, { status: 400 });
    }

    const whisperForm = new FormData();
    const fileName = audio.name || (String(audio.type).includes("mp4") ? "speech.mp4" : "speech.webm");
    whisperForm.append("file", audio, fileName);
    whisperForm.append("model", FOUNDER_STT_MODEL);
    whisperForm.append("language", "de");
    whisperForm.append("response_format", "json");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: whisperForm,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("OpenAI STT failed", response.status, detail);
      return NextResponse.json({ error: "Spracherkennung fehlgeschlagen." }, { status: 502 });
    }

    const payload = await response.json().catch(() => ({}));
    const text = String(payload.text ?? "").trim();

    return NextResponse.json({ text });
  } catch (error) {
    console.error("POST /api/onboarding/voice/transcribe", error);
    return NextResponse.json({ error: error.message ?? "Spracherkennung fehlgeschlagen." }, { status: 500 });
  }
}
