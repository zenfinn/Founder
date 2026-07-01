"use client";

import { useEffect, useState } from "react";
import { fetchFounderVoiceStatus } from "@/lib/founder-voice";
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

  const micSession = useFounderMicSession({
    enabled: enabled && apiVoice === true,
    paused,
    onTranscriptComplete,
  });

  const webSession = useFounderVoiceSession({
    enabled: enabled && apiVoice === false,
    paused,
    onTranscriptComplete,
  });

  if (apiVoice === null) {
    return {
      ready: false,
      engine: "loading",
      supported: false,
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

  const session = apiVoice ? micSession : webSession;

  return {
    ready: true,
    engine: apiVoice ? "openai" : "browser",
    supported: session.supported,
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
