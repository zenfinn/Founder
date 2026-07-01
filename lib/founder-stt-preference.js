import { isMediaRecorderSupported, isSpeechRecognitionSupported } from "@/lib/founder-voice";

/** Safari/iOS: native Web Speech API is far more reliable than MediaRecorder → Whisper. */
export function preferBrowserSpeechRecognition() {
  if (typeof window === "undefined" || !isSpeechRecognitionSupported()) return false;

  const ua = navigator.userAgent;
  const isIOS =
    /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari =
    isIOS || (/Safari/i.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|Edg|OPR/i.test(ua));

  return isSafari;
}

export function isWhisperRecordingSupported() {
  return isMediaRecorderSupported() && !preferBrowserSpeechRecognition();
}

export function isSttSupported() {
  return isWhisperRecordingSupported() || isSpeechRecognitionSupported();
}

export function pickSttEngine(apiVoiceEnabled) {
  if (preferBrowserSpeechRecognition()) return "browser";
  if (apiVoiceEnabled && isWhisperRecordingSupported()) return "whisper";
  if (isSpeechRecognitionSupported()) return "browser";
  return "none";
}
