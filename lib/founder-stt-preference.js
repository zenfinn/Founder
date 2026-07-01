import { isSafari } from "@/lib/founder-browser";
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
 * Safari: webkitSpeechRecognition direkt im Tap — Whisper/MediaRecorder bricht ohne User-Gesture.
 * Desktop: Whisper wenn API da, sonst Browser-STT.
 */
export function pickSttEngine(apiVoiceEnabled) {
  if (isSafari() && isSpeechRecognitionSupported()) return "browser";
  if (apiVoiceEnabled && isMediaRecorderSupported()) return "whisper";
  if (isSpeechRecognitionSupported()) return "browser";
  if (isMediaRecorderSupported()) return "whisper";
  return "none";
}
