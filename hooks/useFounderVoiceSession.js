"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isSafari } from "@/lib/founder-browser";
import { isSpeechRecognitionSupported } from "@/lib/founder-voice";

const SILENCE_MS = 1800;
const MIN_UTTERANCE_CHARS = 2;
const SAFARI_LISTEN_MS = 14000;

export function useFounderVoiceSession({ enabled, paused, onTranscriptComplete }) {
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState("");

  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const safariTimerRef = useRef(null);
  const finalBufferRef = useRef("");
  const interimRef = useRef("");
  const onCompleteRef = useRef(onTranscriptComplete);
  const enabledRef = useRef(enabled);
  const pausedRef = useRef(paused);
  const safariRef = useRef(false);

  useEffect(() => {
    safariRef.current = isSafari();
  }, []);

  useEffect(() => {
    onCompleteRef.current = onTranscriptComplete;
  }, [onTranscriptComplete]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const clearSafariTimer = useCallback(() => {
    if (safariTimerRef.current) {
      window.clearTimeout(safariTimerRef.current);
      safariTimerRef.current = null;
    }
  }, []);

  const resetTranscript = useCallback(() => {
    finalBufferRef.current = "";
    interimRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    clearSilenceTimer();
    clearSafariTimer();
  }, [clearSafariTimer, clearSilenceTimer]);

  const completeIfReady = useCallback(() => {
    const combined = `${finalBufferRef.current} ${interimRef.current}`.trim();
    if (combined.length < MIN_UTTERANCE_CHARS) return;

    shouldListenRef.current = false;
    clearSafariTimer();
    try {
      recognitionRef.current?.stop?.();
    } catch {
      // ignore
    }
    setListening(false);
    clearSilenceTimer();
    onCompleteRef.current?.(combined);
  }, [clearSafariTimer, clearSilenceTimer]);

  const scheduleSilenceCheck = useCallback(() => {
    if (safariRef.current) return;
    clearSilenceTimer();
    silenceTimerRef.current = window.setTimeout(completeIfReady, SILENCE_MS);
  }, [clearSilenceTimer, completeIfReady]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    clearSilenceTimer();
    clearSafariTimer();
    try {
      recognitionRef.current?.stop?.();
    } catch {
      // ignore
    }
    setListening(false);
  }, [clearSafariTimer, clearSilenceTimer]);

  const startListening = useCallback(({ force = false } = {}) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError("Spracherkennung wird in diesem Browser nicht unterstützt.");
      return;
    }

    if (force) {
      enabledRef.current = true;
      pausedRef.current = false;
    }

    if (!force && (!enabledRef.current || pausedRef.current)) return;

    stopListening();
    shouldListenRef.current = true;
    setMicError("");

    const recognition = new SpeechRecognition();
    recognition.lang = "de-DE";
    recognition.continuous = !safariRef.current;
    recognition.interimResults = !safariRef.current;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setMicError("");
    };

    recognition.onresult = (event) => {
      if (safariRef.current) {
        const piece = String(event.results?.[event.resultIndex]?.[0]?.transcript ?? "").trim();
        if (!piece) return;
        finalBufferRef.current = piece;
        setTranscript(piece);
        return;
      }

      let interim = "";
      let finals = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const piece = event.results[index][0]?.transcript ?? "";
        if (event.results[index].isFinal) finals += piece;
        else interim += piece;
      }

      if (finals) {
        finalBufferRef.current = `${finalBufferRef.current} ${finals}`.trim();
        setTranscript(finalBufferRef.current);
      }

      interimRef.current = interim.trim();
      setInterimTranscript(interimRef.current);
      scheduleSilenceCheck();
    };

    recognition.onerror = (event) => {
      const code = event.error ?? "unknown";

      if (code === "not-allowed" || code === "service-not-allowed") {
        setMicError("Mikrofon verweigert — Safari → Einstellungen → Websites → Mikrofon erlauben.");
        shouldListenRef.current = false;
        setListening(false);
        return;
      }

      if (code === "no-speech") {
        if (safariRef.current) {
          setMicError("Nichts gehört — tippe die Kugel und sprich lauter.");
        }
        return;
      }

      if (code === "aborted") return;

      setMicError("Spracherkennung unterbrochen — tippe die Kugel nochmal.");
    };

    recognition.onend = () => {
      setListening(false);
      clearSafariTimer();

      if (safariRef.current) {
        const combined = finalBufferRef.current.trim();
        if (combined.length >= MIN_UTTERANCE_CHARS) {
          shouldListenRef.current = false;
          onCompleteRef.current?.(combined);
        } else if (shouldListenRef.current) {
          setMicError("Nichts gehört — tippe die Kugel und sprich direkt.");
        }
        return;
      }

      if (!shouldListenRef.current || pausedRef.current || !enabledRef.current) return;

      window.setTimeout(() => {
        if (!shouldListenRef.current || pausedRef.current || !enabledRef.current) return;
        try {
          recognition.start();
        } catch {
          // restart via new tap
        }
      }, 300);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      setMicError(error.message ?? "Mikrofon konnte nicht gestartet werden — nochmal tippen.");
      setListening(false);
      return;
    }

    if (safariRef.current) {
      clearSafariTimer();
      safariTimerRef.current = window.setTimeout(() => {
        try {
          recognition.stop();
        } catch {
          // ignore
        }
      }, SAFARI_LISTEN_MS);
    }
  }, [clearSafariTimer, scheduleSilenceCheck, stopListening]);

  useEffect(() => {
    if (!enabled || paused) {
      stopListening();
      return undefined;
    }

    return () => stopListening();
  }, [enabled, paused, stopListening]);

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      clearSilenceTimer();
      clearSafariTimer();
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // ignore
      }
    };
  }, [clearSafariTimer, clearSilenceTimer]);

  const liveTranscript = `${transcript}${interimTranscript ? ` ${interimTranscript}` : ""}`.trim();

  return {
    supported: isSpeechRecognitionSupported(),
    listening,
    recording: false,
    processing: false,
    micError,
    liveTranscript,
    resetTranscript,
    stopListening,
    startListening,
  };
}
