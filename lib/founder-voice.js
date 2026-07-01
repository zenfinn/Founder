const MALE_VOICE_HINTS = [/daniel/i, /markus/i, /yannick/i, /jan\b/i, /michael/i, /stefan/i, /thomas/i, /male/i, /männlich/i];
const FEMALE_VOICE_HINTS = [/anna/i, /petra/i, /helena/i, /katrin/i, /victoria/i, /female/i, /weiblich/i, /samantha/i];

let voicesReadyPromise = null;

function getSpeechSynthesis() {
  if (typeof window === "undefined") return null;
  return window.speechSynthesis ?? null;
}

export function isSpeechRecognitionSupported() {
  if (typeof window === "undefined") return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported() {
  return Boolean(getSpeechSynthesis());
}

export function waitForVoices() {
  const synth = getSpeechSynthesis();
  if (!synth) return Promise.resolve([]);

  const existing = synth.getVoices();
  if (existing.length > 0) return Promise.resolve(existing);

  if (!voicesReadyPromise) {
    voicesReadyPromise = new Promise((resolve) => {
      const finish = () => resolve(synth.getVoices());
      synth.addEventListener("voiceschanged", finish, { once: true });
      window.setTimeout(finish, 400);
    });
  }

  return voicesReadyPromise;
}

export function pickMaleGermanVoice(voices = []) {
  const german = voices.filter((voice) => voice.lang?.toLowerCase().startsWith("de"));
  if (!german.length) return null;

  for (const pattern of MALE_VOICE_HINTS) {
    const match = german.find((voice) => pattern.test(voice.name));
    if (match) return match;
  }

  const nonFemale = german.find((voice) => !FEMALE_VOICE_HINTS.some((pattern) => pattern.test(voice.name)));
  return nonFemale ?? german[0];
}

export async function speakFounderText(text, { rate = 0.92, pitch = 0.82, volume = 1 } = {}) {
  const synth = getSpeechSynthesis();
  if (!synth || !text?.trim()) return;

  const voices = await waitForVoices();
  const voice = pickMaleGermanVoice(voices);

  return new Promise((resolve) => {
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    if (voice) utterance.voice = voice;

    const done = () => resolve();
    utterance.onend = done;
    utterance.onerror = done;

    window.setTimeout(() => synth.speak(utterance), 60);
  });
}

export function stopFounderSpeech() {
  getSpeechSynthesis()?.cancel();
}
