import { NextResponse } from "next/server";
import { isOpenAiVoiceConfigured } from "@/lib/openai-voice";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    enabled: isOpenAiVoiceConfigured(),
    tts: isOpenAiVoiceConfigured(),
    stt: isOpenAiVoiceConfigured(),
  });
}
