export function isOpenAiVoiceConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export const FOUNDER_TTS_VOICE = "cedar";
export const FOUNDER_TTS_MODEL = "gpt-4o-mini-tts";
export const FOUNDER_STT_MODEL = "whisper-1";
