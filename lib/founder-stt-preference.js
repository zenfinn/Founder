import { isIos, isMacDesktop, isSafari } from "@/lib/founder-browser";
import { isMediaRecorderSupported, isSpeechRecognitionSupported } from "@/lib/founder-voice";

export function preferBrowserSpeechRecognition() {
  return isSpeechRecognitionSupported();
}

export function isWhisperRecordingSupported() {
  return isMediaRecorderSupported();
}

export function isSttSupported() {
  return isSpeechRecognitionSupported() || isMediaRecorderSupported();
}

/**
 * iPhone Safari: webkitSpeechRecognition im Tap — zuverlässig.
 * Mac Chrome/Edge: Browser-STT (continuous) — Whisper-Chunks hacken oft auf macOS.
 * Mac Safari: Whisper wenn API da, sonst Browser.
 * Sonst: Whisper wenn API da, sonst Browser.
 */
export function pickSttEngine(apiVoiceEnabled) {
  if (isIos() && isSafari() && isSpeechRecognitionSupported()) return "browser";
  if (isMacDesktop() && !isSafari() && isSpeechRecognitionSupported()) return "browser";
  if (isMacDesktop() && apiVoiceEnabled && isMediaRecorderSupported()) return "whisper";
  if (apiVoiceEnabled && isMediaRecorderSupported()) return "whisper";
  if (isSpeechRecognitionSupported()) return "browser";
  if (isMediaRecorderSupported()) return "whisper";
  return "none";
}
