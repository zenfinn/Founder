const MALE_VOICE_HINTS = [
  /daniel/i,
  /markus/i,
  /yannick/i,
  /jan\b/i,
  /michael/i,
  /stefan/i,
  /thomas/i,
  /martin/i,
  /male/i,
  /männlich/i,
];
const FEMALE_VOICE_HINTS = [/anna/i, /petra/i, /helena/i, /katrin/i, /victoria/i, /female/i, /weiblich/i, /samantha/i];

let voicesReadyPromise = null;
let currentAudio = null;
let voiceApiAvailable = null;

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

export function isMediaRecorderSupported() {
  if (typeof window === "undefined") return false;
  return Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
}

export function invalidateFounderVoiceCache() {
  voiceApiAvailable = null;
}

export async function fetchFounderVoiceStatus({ force = false } = {}) {
  if (!force && voiceApiAvailable !== null) return voiceApiAvailable;

  try {
    const response = await fetch("/api/onboarding/voice/status", { cache: "no-store" });
    if (!response.ok) {
      voiceApiAvailable = false;
      return voiceApiAvailable;
    }
    const payload = await response.json();
    voiceApiAvailable = Boolean(payload.enabled);
    return voiceApiAvailable;
  } catch {
    voiceApiAvailable = false;
    return false;
  }
}

export async function isFounderVoiceSupported() {
  const apiVoice = await fetchFounderVoiceStatus();
  if (apiVoice) return isMediaRecorderSupported();
  return false;
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
      window.setTimeout(finish, 800);
    });
  }

  return voicesReadyPromise;
}

export function pickMaleGermanVoice(voices = []) {
  const german = voices.filter((voice) => voice.lang?.toLowerCase().startsWith("de"));
  if (!german.length) return null;

  const enhanced = german.find((voice) => /premium|enhanced|neural/i.test(voice.name));
  if (enhanced && !FEMALE_VOICE_HINTS.some((pattern) => pattern.test(enhanced.name))) {
    return enhanced;
  }

  for (const pattern of MALE_VOICE_HINTS) {
    const match = german.find((voice) => pattern.test(voice.name));
    if (match) return match;
  }

  const nonFemale = german.find((voice) => !FEMALE_VOICE_HINTS.some((pattern) => pattern.test(voice.name)));
  return nonFemale ?? german[0];
}

async function speakFounderTextInBrowser(text, { rate = 0.9, pitch = 0.78, volume = 1 } = {}) {
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

    window.setTimeout(() => synth.speak(utterance), 80);
  });
}

async function speakFounderTextWithApi(text) {
  const response = await fetch("/api/onboarding/voice/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) return false;

  const blob = await response.blob();
  if (!blob.size) return false;

  stopFounderSpeech();

  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  currentAudio = audio;

  await new Promise((resolve, reject) => {
    audio.onended = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      resolve();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      reject(new Error("Audio konnte nicht abgespielt werden."));
    };
    audio.play().catch(reject);
  });

  return true;
}

export async function speakFounderText(text, options = {}) {
  if (!text?.trim()) return { engine: "none" };

  const apiVoice = await fetchFounderVoiceStatus();
  if (apiVoice) {
    try {
      const ok = await speakFounderTextWithApi(text);
      if (ok) return { engine: "openai" };
    } catch (error) {
      console.warn("Founder API TTS failed", error);
      throw error;
    }
  }

  await speakFounderTextInBrowser(text, options);
  return { engine: "browser" };
}

export function stopFounderSpeech() {
  getSpeechSynthesis()?.cancel();

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

export function pickRecorderMimeType() {
  if (typeof window === "undefined" || !window.MediaRecorder) return "";

  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}
