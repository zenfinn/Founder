"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isSpeechRecognitionSupported } from "@/lib/founder-voice";

const SILENCE_MS = 1800;
const MIN_UTTERANCE_CHARS = 2;

export function useFounderVoiceSession({ enabled, paused, onTranscriptComplete }) {
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState("");

  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const finalBufferRef = useRef("");
  const interimRef = useRef("");
  const onCompleteRef = useRef(onTranscriptComplete);
  const enabledRef = useRef(enabled);
  const pausedRef = useRef(paused);

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

  const resetTranscript = useCallback(() => {
    finalBufferRef.current = "";
    interimRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    clearSilenceTimer();
  }, [clearSilenceTimer]);

  const completeIfReady = useCallback(() => {
    const combined = `${finalBufferRef.current} ${interimRef.current}`.trim();
    if (combined.length < MIN_UTTERANCE_CHARS) return;

    shouldListenRef.current = false;
    try {
      recognitionRef.current?.stop?.();
    } catch {
      // ignore
    }
    setListening(false);
    clearSilenceTimer();
    onCompleteRef.current?.(combined);
  }, [clearSilenceTimer]);

  const scheduleSilenceCheck = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = window.setTimeout(completeIfReady, SILENCE_MS);
  }, [clearSilenceTimer, completeIfReady]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    clearSilenceTimer();
    try {
      recognitionRef.current?.stop?.();
    } catch {
      // ignore
    }
    setListening(false);
  }, [clearSilenceTimer]);

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
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setMicError("");
    };

    recognition.onresult = (event) => {
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
        setMicError("Mikrofon verweigert — bitte in den Browser-Einstellungen erlauben.");
        shouldListenRef.current = false;
        setListening(false);
        return;
      }

      if (code === "no-speech" || code === "aborted") return;

      setMicError("Spracherkennung unterbrochen — tippe die Kugel nochmal.");
    };

    recognition.onend = () => {
      setListening(false);
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
      setMicError(error.message ?? "Mikrofon konnte nicht gestartet werden.");
      setListening(false);
    }
  }, [scheduleSilenceCheck, stopListening]);

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
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // ignore
      }
    };
  }, [clearSilenceTimer]);

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
