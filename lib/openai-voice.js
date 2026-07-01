export function isOpenAiVoiceConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

/** Chat model for Founder Jarvis — gpt-4o for natural, thoughtful replies. */
export const FOUNDER_CHAT_MODEL = process.env.FOUNDER_CHAT_MODEL?.trim() || "gpt-4o";

export const FOUNDER_TTS_VOICE = "cedar";
export const FOUNDER_TTS_MODEL = "gpt-4o-mini-tts";
export const FOUNDER_STT_MODEL = "whisper-1";
