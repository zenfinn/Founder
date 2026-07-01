"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchFounderVoiceStatus, isSpeechRecognitionSupported } from "@/lib/founder-voice";
import { isSttSupported, isWhisperRecordingSupported, pickSttEngine } from "@/lib/founder-stt-preference";
import { useFounderMicSession } from "@/hooks/useFounderMicSession";
import { useFounderVoiceSession } from "@/hooks/useFounderVoiceSession";

export function useFounderSpeechInput({ enabled, paused, onTranscriptComplete }) {
  const [apiVoice, setApiVoice] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetchFounderVoiceStatus().then((value) => {
      if (!cancelled) setApiVoice(value);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const engine = useMemo(() => {
    if (apiVoice === null) return "loading";
    return pickSttEngine(apiVoice);
  }, [apiVoice]);

  const useWhisper = engine === "whisper";
  const useBrowser = engine === "browser";

  const micSession = useFounderMicSession({
    enabled: enabled && useWhisper,
    paused,
    onTranscriptComplete,
  });

  const webSession = useFounderVoiceSession({
    enabled: enabled && useBrowser,
    paused,
    onTranscriptComplete,
  });

  if (apiVoice === null || engine === "loading") {
    return {
      ready: false,
      engine: "loading",
      supported: isSttSupported(),
      listening: false,
      recording: false,
      processing: false,
      micError: "",
      liveTranscript: "",
      resetTranscript: () => {},
      stopListening: () => {},
      startListening: () => {},
    };
  }

  const session = useWhisper ? micSession : webSession;

  return {
    ready: true,
    engine: useWhisper ? "whisper" : "browser",
    supported: useWhisper ? isWhisperRecordingSupported() : isSpeechRecognitionSupported(),
    listening: session.listening,
    recording: Boolean(session.recording),
    processing: Boolean(session.processing),
    micError: session.micError,
    liveTranscript: session.liveTranscript,
    resetTranscript: session.resetTranscript,
    stopListening: session.stopListening,
    startListening: session.startListening,
  };
}
