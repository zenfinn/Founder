import { NextResponse } from "next/server";
import { FOUNDER_TTS_MODEL, FOUNDER_TTS_VOICE, isOpenAiVoiceConfigured } from "@/lib/openai-voice";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    enabled: isOpenAiVoiceConfigured(),
    tts: isOpenAiVoiceConfigured(),
    stt: isOpenAiVoiceConfigured(),
    model: FOUNDER_TTS_MODEL,
    voice: FOUNDER_TTS_VOICE,
  });
}
