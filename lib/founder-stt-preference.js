import { isMediaRecorderSupported, isSpeechRecognitionSupported } from "@/lib/founder-voice";

export function preferBrowserSpeechRecognition() {
  return isSpeechRecognitionSupported();
}

export function isWhisperRecordingSupported() {
  return isMediaRecorderSupported() && !isSpeechRecognitionSupported();
}

export function isSttSupported() {
  return isSpeechRecognitionSupported() || isMediaRecorderSupported();
}

/** Browser STT first — most reliable across Safari, iOS, and desktop. */
export function pickSttEngine(_apiVoiceEnabled) {
  if (isSpeechRecognitionSupported()) return "browser";
  if (isMediaRecorderSupported()) return "whisper";
  return "none";
}
