/** Minimal silent WAV — unlocks iOS/Safari audio in a user gesture. */
const SILENT_AUDIO =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

let audioContext = null;
let htmlAudio = null;
let unlocked = false;

export function unlockFounderAudioPlayback() {
  if (typeof window === "undefined") return;

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx && !audioContext) {
      audioContext = new AudioCtx();
    }
    if (audioContext?.state === "suspended") {
      void audioContext.resume();
    }
  } catch {
    // ignore
  }

  if (!htmlAudio) {
    htmlAudio = new Audio();
    htmlAudio.playsInline = true;
    htmlAudio.setAttribute("playsinline", "true");
    htmlAudio.setAttribute("webkit-playsinline", "true");
    htmlAudio.preload = "auto";
  }

  if (unlocked) return;

  htmlAudio.src = SILENT_AUDIO;
  htmlAudio.volume = 0.01;
  const playPromise = htmlAudio.play();
  if (!playPromise) {
    unlocked = true;
    return;
  }

  playPromise
    .then(() => {
      unlocked = true;
      htmlAudio.pause();
      htmlAudio.currentTime = 0;
      htmlAudio.volume = 1;
    })
    .catch(() => {
      // Still mark unlocked attempt — Web Audio path may work
      unlocked = true;
    });
}

export async function playFounderMp3Blob(blob) {
  unlockFounderAudioPlayback();

  if (audioContext) {
    try {
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      await new Promise((resolve, reject) => {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.onended = resolve;
        source.onerror = reject;
        source.start(0);
      });
      return "webaudio";
    } catch {
      // HTML Audio fallback below
    }
  }

  const url = URL.createObjectURL(blob);
  const audio = htmlAudio ?? new Audio();
  audio.playsInline = true;
  audio.setAttribute("playsinline", "true");
  audio.setAttribute("webkit-playsinline", "true");
  audio.src = url;

  await new Promise((resolve, reject) => {
    const cleanup = () => URL.revokeObjectURL(url);
    audio.onended = () => {
      cleanup();
      resolve();
    };
    audio.onerror = () => {
      cleanup();
      reject(new Error("Audio konnte nicht abgespielt werden."));
    };
    const playPromise = audio.play();
    if (playPromise) playPromise.catch(reject);
    else resolve();
  });

  return "html";
}

export function stopHtmlAudioPlayback() {
  if (htmlAudio) {
    htmlAudio.pause();
    htmlAudio.currentTime = 0;
    htmlAudio.removeAttribute("src");
    htmlAudio.load();
  }
}
