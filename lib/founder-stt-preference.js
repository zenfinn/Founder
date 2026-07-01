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

/** Whisper first when API is configured — zuverlässiger als Browser-STT auf Safari/iOS. */
export function pickSttEngine(apiVoiceEnabled) {
  if (apiVoiceEnabled && isMediaRecorderSupported()) return "whisper";
  if (isSpeechRecognitionSupported()) return "browser";
  if (isMediaRecorderSupported()) return "whisper";
  return "none";
}
