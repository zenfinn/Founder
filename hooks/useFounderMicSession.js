"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { transcribeOnceWithBrowser } from "@/lib/founder-browser-stt";
import { audioBlobFileName } from "@/lib/founder-audio-upload";
import { isSpeechRecognitionSupported, pickRecorderMimeType, isMediaRecorderSupported } from "@/lib/founder-voice";

const SILENCE_MS = 1700;
const SPEECH_THRESHOLD = 0.012;
const MIN_RECORD_MS = 800;
const MIN_TRANSCRIPT_CHARS = 2;

function measureVolume(analyser) {
  const buffer = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(buffer);

  let sum = 0;
  for (let index = 0; index < buffer.length; index += 1) {
    const sample = (buffer[index] - 128) / 128;
    sum += sample * sample;
  }

  return Math.sqrt(sum / buffer.length);
}

export function useFounderMicSession({ enabled, paused, onTranscriptComplete }) {
  const [liveTranscript, setLiveTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [micError, setMicError] = useState("");

  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const mimeTypeRef = useRef("");
  const rafRef = useRef(null);
  const onCompleteRef = useRef(onTranscriptComplete);
  const pausedRef = useRef(paused);
  const enabledRef = useRef(enabled);
  const speechDetectedRef = useRef(false);
  const silenceStartedAtRef = useRef(0);
  const recordStartedAtRef = useRef(0);
  const processingRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onTranscriptComplete;
  }, [onTranscriptComplete]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const resetTranscript = useCallback(() => {
    setLiveTranscript("");
    speechDetectedRef.current = false;
    silenceStartedAtRef.current = 0;
  }, []);

  const teardown = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    chunksRef.current = [];
    setListening(false);
    setRecording(false);
  }, []);

  const transcribeBlob = useCallback(async (blob) => {
    const formData = new FormData();
    formData.append("audio", blob, audioBlobFileName(blob));

    const response = await fetch("/api/onboarding/voice/transcribe", {
      method: "POST",
      body: formData,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error ?? "Spracherkennung fehlgeschlagen.");
    }

    return String(payload.text ?? "").trim();
  }, []);

  const transcribeWithFallback = useCallback(
    async (blob) => {
      try {
        return await transcribeBlob(blob);
      } catch (whisperError) {
        if (!isSpeechRecognitionSupported()) throw whisperError;

        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        return transcribeOnceWithBrowser();
      }
    },
    [transcribeBlob]
  );

  const finishRecording = useCallback(async () => {
    if (processingRef.current) return;

    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    setRecording(false);
    processingRef.current = true;

    await new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder) {
        resolve();
        return;
      }
      recorder.onstop = resolve;
      try {
        recorder.requestData?.();
      } catch {
        // ignore
      }
      recorder.stop();
    });

    const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current || "audio/webm" });
    chunksRef.current = [];
    recorderRef.current = null;

    if (blob.size < 1500) {
      processingRef.current = false;
      speechDetectedRef.current = false;
      silenceStartedAtRef.current = 0;
      setMicError("Zu kurz aufgenommen — bitte etwas länger sprechen.");
      return;
    }

    setProcessing(true);
    try {
      const text = await transcribeWithFallback(blob);
      setLiveTranscript(text);
      if (text.length >= MIN_TRANSCRIPT_CHARS) {
        onCompleteRef.current?.(text);
      }
    } catch (error) {
      setMicError(error.message ?? "Spracherkennung fehlgeschlagen.");
    } finally {
      processingRef.current = false;
      setProcessing(false);
      speechDetectedRef.current = false;
      silenceStartedAtRef.current = 0;
    }
  }, [transcribeWithFallback]);

  const monitorInput = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser || !enabledRef.current) return;

    if (pausedRef.current || processingRef.current) {
      rafRef.current = requestAnimationFrame(monitorInput);
      return;
    }

    const volume = measureVolume(analyser);
    const now = Date.now();
    const isSpeaking = volume > SPEECH_THRESHOLD;

    if (isSpeaking) {
      speechDetectedRef.current = true;
      silenceStartedAtRef.current = 0;

      if (!recorderRef.current || recorderRef.current.state === "inactive") {
        const mimeType = mimeTypeRef.current;
        if (!streamRef.current) {
          rafRef.current = requestAnimationFrame(monitorInput);
          return;
        }

        chunksRef.current = [];
        const recorder = mimeType
          ? new MediaRecorder(streamRef.current, { mimeType })
          : new MediaRecorder(streamRef.current);
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunksRef.current.push(event.data);
        };
        const timeslice = mimeType ? 300 : undefined;
        if (timeslice) recorder.start(timeslice);
        else recorder.start();
        recorderRef.current = recorder;
        recordStartedAtRef.current = now;
        setRecording(true);
      }
    } else if (speechDetectedRef.current && recorderRef.current?.state === "recording") {
      if (!silenceStartedAtRef.current) silenceStartedAtRef.current = now;

      const silentFor = now - silenceStartedAtRef.current;
      const recordedFor = now - recordStartedAtRef.current;

      if (silentFor >= SILENCE_MS && recordedFor >= MIN_RECORD_MS) {
        finishRecording();
      }
    }

    rafRef.current = requestAnimationFrame(monitorInput);
  }, [finishRecording]);

  const startSession = useCallback(async ({ force = false } = {}) => {
    if (force) enabledRef.current = true;
    if (!force && !enabledRef.current) return;

    const mimeType = pickRecorderMimeType();
    if (typeof window.MediaRecorder === "undefined") {
      setMicError("Audio-Aufnahme wird in diesem Browser nicht unterstützt.");
      return;
    }

    if (streamRef.current) {
      setListening(true);
      if (!rafRef.current) monitorInput();
      return;
    }

    setMicError("");
    mimeTypeRef.current = mimeType;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (!force && !enabledRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      enabledRef.current = true;

      streamRef.current = stream;
      const audioContext = new AudioContext();
      await audioContext.resume();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      setListening(true);
      monitorInput();
    } catch {
      setMicError("Mikrofon-Zugriff verweigert. Bitte in den Systemeinstellungen erlauben.");
    }
  }, [monitorInput]);

  useEffect(() => {
    if (!enabled) return undefined;
    return () => teardown();
  }, [enabled, teardown]);

  return {
    supported: isMediaRecorderSupported(),
    listening: listening || recording,
    recording,
    processing,
    micError,
    liveTranscript,
    resetTranscript,
    stopListening: teardown,
    startListening: startSession,
  };
}
