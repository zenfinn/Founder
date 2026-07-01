"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { speakFounderText, stopFounderSpeech } from "@/lib/founder-voice";

const FounderGlobeContext = createContext(null);

const TYPEWRITER_MS = 14;

export function FounderGlobeProvider({ children }) {
  const [activity, setActivity] = useState("idle");
  const [message, setMessage] = useState("");
  const flowGenerationRef = useRef(0);

  const bumpFlow = useCallback(() => {
    flowGenerationRef.current += 1;
    stopFounderSpeech();
    return flowGenerationRef.current;
  }, []);

  const isFlowCurrent = useCallback((generation) => generation === flowGenerationRef.current, []);

  const setFounderIdle = useCallback(() => {
    setActivity("idle");
    setMessage("");
  }, []);

  const setFounderMessage = useCallback((nextMessage = "") => {
    setActivity("idle");
    setMessage(nextMessage);
  }, []);

  const setFounderSpeaking = useCallback((nextMessage = "") => {
    setActivity("speaking");
    setMessage(nextMessage);
  }, []);

  const setFounderListening = useCallback((nextMessage = "Ich höre zu — sprich einfach los.") => {
    setActivity("listening");
    setMessage(nextMessage);
  }, []);

  const setFounderTyping = useCallback((nextMessage = "") => {
    setActivity("typing");
    setMessage(nextMessage);
  }, []);

  const setFounderThinking = useCallback((nextMessage = "") => {
    setActivity("thinking");
    setMessage(nextMessage);
  }, []);

  const value = useMemo(
    () => ({
      activity,
      message,
      bumpFlow,
      isFlowCurrent,
      setFounderIdle,
      setFounderMessage,
      setFounderSpeaking,
      setFounderListening,
      setFounderTyping,
      setFounderThinking,
    }),
    [
      activity,
      message,
      bumpFlow,
      isFlowCurrent,
      setFounderIdle,
      setFounderMessage,
      setFounderSpeaking,
      setFounderListening,
      setFounderTyping,
      setFounderThinking,
    ]
  );

  return <FounderGlobeContext.Provider value={value}>{children}</FounderGlobeContext.Provider>;
}

export function useFounderGlobe() {
  const context = useContext(FounderGlobeContext);
  if (!context) {
    return {
      activity: "idle",
      message: "",
      bumpFlow: () => 0,
      isFlowCurrent: () => true,
      setFounderIdle: () => {},
      setFounderMessage: () => {},
      setFounderSpeaking: () => {},
      setFounderListening: () => {},
      setFounderTyping: () => {},
      setFounderThinking: () => {},
    };
  }
  return context;
}

export async function typeFounderMessage(setFounderTyping, text, { isCancelled = () => false } = {}) {
  const content = String(text ?? "").trim();
  if (!content) return;

  setFounderTyping("");
  for (let index = 1; index <= content.length; index += 1) {
    if (isCancelled()) return;
    setFounderTyping(content.slice(0, index));
    await new Promise((resolve) => window.setTimeout(resolve, TYPEWRITER_MS));
  }
}

export async function founderSpeak(
  setFounderSpeaking,
  setFounderListening,
  text,
  { listenAfter = true, isCancelled = () => false } = {}
) {
  const content = String(text ?? "").trim();
  if (!content || isCancelled()) return;

  setFounderSpeaking(content);
  await speakFounderText(content);
  if (isCancelled()) return;

  await new Promise((resolve) => window.setTimeout(resolve, 500));

  if (listenAfter && !isCancelled()) {
    setFounderListening();
  }
}
