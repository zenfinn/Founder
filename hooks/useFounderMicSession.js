"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pickRecorderMimeType, isMediaRecorderSupported } from "@/lib/founder-voice";

const SILENCE_MS = 1800;
const SPEECH_THRESHOLD = 0.016;
const MIN_RECORD_MS = 700;
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
  const speechDetectedRef = useRef(false);
  const silenceStartedAtRef = useRef(0);
  const recordStartedAtRef = useRef(0);
  const activeRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onTranscriptComplete;
  }, [onTranscriptComplete]);

  const resetTranscript = useCallback(() => {
    setLiveTranscript("");
    speechDetectedRef.current = false;
    silenceStartedAtRef.current = 0;
  }, []);

  const teardown = useCallback(() => {
    activeRef.current = false;
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
    formData.append("audio", blob, blob.type.includes("mp4") ? "speech.mp4" : "speech.webm");

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

  const finishRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    setRecording(false);

    await new Promise((resolve) => {
      recorder.onstop = resolve;
      recorder.stop();
    });

    const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current || "audio/webm" });
    chunksRef.current = [];

    if (blob.size < 1200) return;

    setProcessing(true);
    try {
      const text = await transcribeBlob(blob);
      setLiveTranscript(text);
      if (text.length >= MIN_TRANSCRIPT_CHARS) {
        onCompleteRef.current?.(text);
      }
    } catch (error) {
      setMicError(error.message ?? "Spracherkennung fehlgeschlagen.");
    } finally {
      setProcessing(false);
      speechDetectedRef.current = false;
      silenceStartedAtRef.current = 0;
    }
  }, [transcribeBlob]);

  const monitorInput = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser || !activeRef.current) return;

    const volume = measureVolume(analyser);
    const now = Date.now();
    const isSpeaking = volume > SPEECH_THRESHOLD;

    if (isSpeaking) {
      speechDetectedRef.current = true;
      silenceStartedAtRef.current = 0;

      if (!recorderRef.current || recorderRef.current.state === "inactive") {
        const mimeType = mimeTypeRef.current;
        if (!mimeType || !streamRef.current) return;

        chunksRef.current = [];
        const recorder = new MediaRecorder(streamRef.current, { mimeType });
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunksRef.current.push(event.data);
        };
        recorder.start(250);
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

  const startSession = useCallback(async () => {
    if (!enabled || paused || activeRef.current) return;

    const mimeType = pickRecorderMimeType();
    if (!mimeType) {
      setMicError("Audio-Aufnahme wird in diesem Browser nicht unterstützt.");
      return;
    }

    teardown();
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

      if (!enabled || paused) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      const audioContext = new AudioContext();
      await audioContext.resume();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      activeRef.current = true;
      setListening(true);
      monitorInput();
    } catch (error) {
      setMicError("Mikrofon-Zugriff verweigert. Bitte in den Systemeinstellungen erlauben.");
    }
  }, [enabled, paused, monitorInput, teardown]);

  useEffect(() => {
    if (!enabled || paused) {
      teardown();
      return undefined;
    }

    startSession();
    return () => teardown();
  }, [enabled, paused, startSession, teardown]);

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
