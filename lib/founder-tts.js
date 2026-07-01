export const FOUNDER_TTS_INSTRUCTIONS =
  "Speak in German. Deep, calm, confident adult male voice like JARVIS from Iron Man — warm baritone, intelligent, authoritative but friendly. Natural pace, clear articulation, never feminine or childlike.";

/** Normalize German copy for more natural TTS output. */
export function prepareTextForTts(text) {
  return String(text ?? "")
    .replace(/[„""«»]/g, "")
    .replace(/\*\*/g, "")
    .replace(/(\d)\s*€/g, "$1 Euro")
    .replace(/€/g, " Euro ")
    .replace(/\s*—\s*/g, ", ")
    .replace(/\s*…/g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

/** Ordered attempts — male voices only. */
export function getFounderTtsAttempts() {
  const primaryModel = process.env.FOUNDER_TTS_MODEL?.trim() || "gpt-4o-mini-tts";
  const primaryVoice = process.env.FOUNDER_TTS_VOICE?.trim() || "ash";

  return [
    {
      model: primaryModel,
      voice: primaryVoice,
      speed: 0.92,
      instructions: FOUNDER_TTS_INSTRUCTIONS,
      response_format: "mp3",
    },
    {
      model: "gpt-4o-mini-tts",
      voice: "ash",
      speed: 0.91,
      instructions: FOUNDER_TTS_INSTRUCTIONS,
      response_format: "mp3",
    },
    {
      model: "gpt-4o-mini-tts",
      voice: "cedar",
      speed: 0.92,
      instructions: FOUNDER_TTS_INSTRUCTIONS,
      response_format: "mp3",
    },
    {
      model: "tts-1-hd",
      voice: "onyx",
      speed: 0.9,
      response_format: "mp3",
    },
    {
      model: "tts-1",
      voice: "onyx",
      speed: 0.9,
      response_format: "mp3",
    },
  ];
}
