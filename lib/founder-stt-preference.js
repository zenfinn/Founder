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
 * Mac Desktop: Whisper (MediaRecorder) — Browser-STT hackt auf macOS oft.
 * Sonst: Whisper wenn API da, sonst Browser-STT.
 */
export function pickSttEngine(apiVoiceEnabled) {
  if (isIos() && isSafari() && isSpeechRecognitionSupported()) return "browser";
  if (isMacDesktop() && apiVoiceEnabled && isMediaRecorderSupported()) return "whisper";
  if (isSafari() && isSpeechRecognitionSupported()) return "browser";
  if (apiVoiceEnabled && isMediaRecorderSupported()) return "whisper";
  if (isSpeechRecognitionSupported()) return "browser";
  if (isMediaRecorderSupported()) return "whisper";
  return "none";
}
