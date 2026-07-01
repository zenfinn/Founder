export const FOUNDER_TTS_INSTRUCTIONS =
  "Speak in German. Calm, confident male AI assistant like JARVIS — warm, intelligent, focused. Natural conversational pace, slightly slower than normal. Clear articulation with gentle intonation, not robotic or monotone.";

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

/** Ordered attempts — first success wins. */
export function getFounderTtsAttempts() {
  const primaryModel = process.env.FOUNDER_TTS_MODEL?.trim() || "gpt-4o-mini-tts";
  const primaryVoice = process.env.FOUNDER_TTS_VOICE?.trim() || "cedar";

  return [
    {
      model: primaryModel,
      voice: primaryVoice,
      speed: 0.95,
      instructions: FOUNDER_TTS_INSTRUCTIONS,
      response_format: "mp3",
    },
    {
      model: "gpt-4o-mini-tts",
      voice: "echo",
      speed: 0.94,
      instructions: FOUNDER_TTS_INSTRUCTIONS,
      response_format: "mp3",
    },
    {
      model: "tts-1-hd",
      voice: "echo",
      speed: 0.93,
      response_format: "mp3",
    },
  ];
}

export async function synthesizeFounderSpeech(text, apiKey) {
  const input = prepareTextForTts(text);
  if (!input) throw new Error("Text fehlt.");

  const attempts = getFounderTtsAttempts();
  let lastError = null;

  for (const attempt of attempts) {
    const body = {
      model: attempt.model,
      voice: attempt.voice,
      input: input.slice(0, 1200),
      response_format: attempt.response_format ?? "mp3",
      speed: attempt.speed ?? 0.95,
    };

    if (attempt.instructions) {
      body.instructions = attempt.instructions;
    }

    try {
      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        lastError = new Error(`${attempt.model}/${attempt.voice}: ${response.status} ${detail.slice(0, 80)}`);
        continue;
      }

      const audio = await response.arrayBuffer();
      if (!audio.byteLength) {
        lastError = new Error(`${attempt.model}: leere Antwort`);
        continue;
      }

      return {
        audio,
        engine: `${attempt.model}:${attempt.voice}`,
        contentType: "audio/mpeg",
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Sprachausgabe fehlgeschlagen.");
}
