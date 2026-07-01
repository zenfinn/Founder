"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { speakFounderText } from "@/lib/founder-voice";

const FounderGlobeContext = createContext(null);

const TYPEWRITER_MS = 16;

export function FounderGlobeProvider({ children }) {
  const [activity, setActivity] = useState("idle");
  const [message, setMessage] = useState("");

  const setFounderIdle = useCallback(() => {
    setActivity("idle");
    setMessage("");
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
      setFounderIdle,
      setFounderSpeaking,
      setFounderListening,
      setFounderTyping,
      setFounderThinking,
    }),
    [
      activity,
      message,
      setFounderIdle,
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
      setFounderIdle: () => {},
      setFounderSpeaking: () => {},
      setFounderListening: () => {},
      setFounderTyping: () => {},
      setFounderThinking: () => {},
    };
  }
  return context;
}

export async function typeFounderMessage(setFounderTyping, text) {
  const content = String(text ?? "").trim();
  if (!content) return;

  setFounderTyping("");
  for (let index = 1; index <= content.length; index += 1) {
    setFounderTyping(content.slice(0, index));
    await new Promise((resolve) => window.setTimeout(resolve, TYPEWRITER_MS));
  }
}

export async function founderSpeak(setFounderSpeaking, setFounderListening, text, { listenAfter = true } = {}) {
  const content = String(text ?? "").trim();
  if (!content) return;

  setFounderSpeaking(content);
  await speakFounderText(content);

  if (listenAfter) {
    setFounderListening();
  }
}
