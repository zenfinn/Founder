export function isOpenAiVoiceConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export const FOUNDER_TTS_VOICE = "onyx";
export const FOUNDER_TTS_MODEL = "tts-1";
export const FOUNDER_STT_MODEL = "whisper-1";
