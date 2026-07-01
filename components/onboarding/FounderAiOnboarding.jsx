"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare, Mic, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CockpitPage, CockpitPanel } from "@/components/cockpit/CockpitPage";
import { useFounderGlobe } from "@/components/cockpit/FounderGlobeContext";
import {
  FounderNicheStaircase,
  FounderStaircaseLoading,
} from "@/components/onboarding/FounderNicheStaircase";
import { useFounderSpeechInput } from "@/hooks/useFounderSpeechInput";
import {
  readOnboardingComplete,
  writeOnboardingComplete,
  writeOnboardingSkipped,
} from "@/lib/founder-ai-onboarding";
import { getJarvisOpeningMessage } from "@/lib/founder-jarvis";
import { isSttSupported } from "@/lib/founder-stt-preference";
import { isSafari } from "@/lib/founder-browser";
import {
  fetchFounderVoiceStatus,
  invalidateFounderVoiceCache,
  speakFounderText,
  stopFounderSpeech,
} from "@/lib/founder-voice";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { saveOwnProfile } from "@/lib/profiles";

function ChatBubble({ message }) {
  const isFounder = message.role === "founder";
  return (
    <div
      className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${
        isFounder
          ? "mr-auto bg-[#1a3aad]/25 text-neutral-100"
          : "ml-auto border border-white/10 bg-[#1a3aad]/10 text-white"
      }`}
    >
      {message.text}
    </div>
  );
}

export function FounderAiOnboarding({ persistent = false }) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [userId, setUserId] = useState("");
  const [phase, setPhase] = useState("chat");
  const [voiceMode, setVoiceMode] = useState(true);
  const [globeActivated, setGlobeActivated] = useState(false);
  const [messages, setMessages] = useState([]);
  const [profile, setProfile] = useState({});
  const [readyForRanking, setReadyForRanking] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [rankedGroups, setRankedGroups] = useState([]);
  const [joinedSlugs, setJoinedSlugs] = useState({});
  const [joiningSlug, setJoiningSlug] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);

  const {
    setFounderIdle,
    setFounderSpeaking,
    setFounderListening,
    setFounderThinking,
    setFounderMessage,
    registerGlobeTap,
    setVoiceGlobe,
  } = useFounderGlobe();

  const messagesRef = useRef(messages);
  const profileRef = useRef(profile);
  const phaseRef = useRef(phase);
  const voiceModeRef = useRef(voiceMode);
  const processingVoiceRef = useRef(false);
  const chatEndRef = useRef(null);
  const openingStartedRef = useRef(false);
  const openingSpokenRef = useRef(false);
  const globeActivatedRef = useRef(false);
  const speechRef = useRef(null);

  const micPaused = chatLoading || isSpeaking;
  const voiceInputEnabled = voiceMode && phase === "chat" && globeActivated;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    voiceModeRef.current = voiceMode;
  }, [voiceMode]);

  useEffect(() => {
    invalidateFounderVoiceCache();
    fetchFounderVoiceStatus({ force: true }).then(() => {
      const supported = isSttSupported();
      setSpeechSupported(supported);
      if (!supported) setVoiceMode(false);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        router.replace("/login");
        return;
      }
      if (!persistent && readOnboardingComplete(user.id)) {
        router.replace("/dashboard");
        return;
      }
      setUserId(user.id);
    }

    loadUser();
    return () => {
      cancelled = true;
    };
  }, [persistent, router, supabase]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, chatLoading]);

  const lastFounderText = useMemo(() => {
    const founderMessages = messages.filter((message) => message.role === "founder");
    return founderMessages[founderMessages.length - 1]?.text ?? "";
  }, [messages]);

  const resumeListening = useCallback(() => {
    if (!voiceModeRef.current || phaseRef.current !== "chat") return;
    // Safari verliert User-Gesture nach async TTS — Nutzer muss erneut tippen
    if (isSafari()) {
      setFounderListening("Tippe die Kugel — sprich jetzt.");
      return;
    }
    window.setTimeout(() => {
      speechRef.current?.resetTranscript?.();
      speechRef.current?.startListening?.({ force: true });
    }, 500);
  }, [setFounderListening]);

  const playFounderVoice = useCallback(
    async (text) => {
      if (!voiceModeRef.current || !text?.trim()) return;
      setIsSpeaking(true);
      setFounderSpeaking(text);
      try {
        await speakFounderText(text);
      } catch (error) {
        console.warn("Founder TTS failed", error);
      } finally {
        setIsSpeaking(false);
        if (voiceModeRef.current) {
          setFounderListening("Sprich — ich höre zu.");
          resumeListening();
        } else {
          setFounderMessage(text);
        }
      }
    },
    [resumeListening, setFounderListening, setFounderMessage, setFounderSpeaking]
  );

  useEffect(() => {
    if (openingStartedRef.current) return;
    openingStartedRef.current = true;

    const opening = getJarvisOpeningMessage();
    setMessages([{ role: "founder", text: opening }]);
    setFounderMessage(opening);
  }, [setFounderMessage]);

  useEffect(() => {
    return () => {
      stopFounderSpeech();
      setFounderIdle();
    };
  }, [setFounderIdle]);

  const sendUserMessage = useCallback(
    async (rawText) => {
      const text = String(rawText ?? "").trim();
      if (!text || chatLoading || phaseRef.current !== "chat") return;

      speechRef.current?.stopListening?.();

      const userMessage = { role: "user", text };
      const nextMessages = [...messagesRef.current, userMessage];
      setMessages(nextMessages);
      setTextInput("");
      setChatLoading(true);
      setFounderThinking("Founder denkt nach…");

      try {
        const response = await fetch("/api/onboarding/founder/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: nextMessages, profile: profileRef.current }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error ?? "Antwort fehlgeschlagen.");

        const reply = payload.reply;
        setMessages((current) => [...current, { role: "founder", text: reply }]);
        const nextProfile = payload.profile ?? {};
        setProfile(nextProfile);
        profileRef.current = nextProfile;
        setReadyForRanking(Boolean(payload.readyForRanking));

        if (voiceModeRef.current) {
          await playFounderVoice(reply);
        } else {
          setFounderMessage(reply);
        }
      } catch (error) {
        const errorText = error.message ?? "Kurz technisches Problem — versuch es nochmal.";
        setMessages((current) => [...current, { role: "founder", text: errorText }]);
        setFounderMessage(errorText);
        if (!isSafari()) resumeListening();
      } finally {
        setChatLoading(false);
      }
    },
    [chatLoading, playFounderVoice, resumeListening, setFounderMessage, setFounderThinking]
  );

  const handleSpeechComplete = useCallback(
    (text) => {
      if (processingVoiceRef.current || phaseRef.current !== "chat") return;
      const value = String(text ?? "").trim();
      if (!value || value.length < 2) {
        if (!isSafari()) resumeListening();
        return;
      }

      processingVoiceRef.current = true;
      sendUserMessage(value).finally(() => {
        window.setTimeout(() => {
          processingVoiceRef.current = false;
        }, 600);
      });
    },
    [resumeListening, sendUserMessage]
  );

  const speech = useFounderSpeechInput({
    enabled: voiceInputEnabled,
    paused: micPaused,
    onTranscriptComplete: handleSpeechComplete,
  });

  speechRef.current = speech;

  const globeStatus = chatLoading
    ? "thinking"
    : isSpeaking
      ? "speaking"
      : speech.processing
        ? "processing"
        : speech.listening
          ? "listening"
          : "idle";

  const handleGlobeTap = useCallback(() => {
    if (!speechSupported) {
      setVoiceMode(false);
      return;
    }

    flushSync(() => {
      setVoiceMode(true);
      setGlobeActivated(true);
      globeActivatedRef.current = true;
    });

    if (!openingSpokenRef.current) {
      openingSpokenRef.current = true;
      void playFounderVoice(getJarvisOpeningMessage());
      return;
    }

    setFounderListening("Sprich jetzt — ich höre zu.");
    stopFounderSpeech();
    speechRef.current?.resetTranscript?.();
    // Sync start — Safari bricht STT bei await vor startListening
    speechRef.current?.startListening?.({ force: true });
  }, [playFounderVoice, setFounderListening, speechSupported]);

  useEffect(() => {
    globeActivatedRef.current = globeActivated;
  }, [globeActivated]);

  useEffect(() => {
    if (!voiceMode || phase !== "chat") return;
    if (chatLoading) {
      setFounderThinking("Founder denkt nach…");
      return;
    }
    if (isSpeaking) return;
    if (speech.listening) {
      setFounderListening(speech.liveTranscript || "Sprich — ich höre zu.");
    }
  }, [
    chatLoading,
    isSpeaking,
    phase,
    setFounderListening,
    setFounderThinking,
    speech.listening,
    speech.liveTranscript,
    voiceMode,
  ]);

  useEffect(() => registerGlobeTap(handleGlobeTap), [handleGlobeTap, registerGlobeTap]);

  useEffect(() => {
    if (!voiceMode || phase !== "chat") {
      setVoiceGlobe({ active: false, hint: "", error: "", tapDisabled: true });
      return undefined;
    }

    const hintByStatus = {
      idle: globeActivated
        ? isSafari()
          ? "Tippe die Kugel — sprich direkt"
          : "Tippe die Kugel — dann sprich"
        : "Tippe die Kugel — sprich mit Founder",
      listening: isSafari() ? "Sprich jetzt…" : speech.engine === "whisper" ? (speech.recording ? "Ich nehme auf…" : "Sprich jetzt — ich höre zu") : "Ich höre zu…",
      processing: "Erkenne deine Sprache…",
      speaking: "Founder spricht…",
      thinking: "Founder denkt nach…",
    };

    setVoiceGlobe({
      active: true,
      hint: hintByStatus[globeStatus] ?? hintByStatus.idle,
      error: speech.micError ?? "",
      tapDisabled: chatLoading || isSpeaking,
    });

    return () => setVoiceGlobe({ active: false, hint: "", error: "", tapDisabled: true });
  }, [
    chatLoading,
    globeActivated,
    globeStatus,
    isSpeaking,
    phase,
    setVoiceGlobe,
    speech.micError,
    speech.engine,
    speech.recording,
    voiceMode,
  ]);

  useEffect(() => {
    if (!voiceMode) return;
    setTextInput(speech.liveTranscript);
  }, [speech.liveTranscript, voiceMode]);

  function disableVoiceMode() {
    speechRef.current?.stopListening?.();
    stopFounderSpeech();
    setGlobeActivated(false);
    globeActivatedRef.current = false;
    setVoiceMode(false);
    setTextInput("");
    setFounderMessage(lastFounderText);
  }

  function enableVoiceMode() {
    handleGlobeTap();
  }

  const runRanking = useCallback(async () => {
    stopFounderSpeech();
    speechRef.current?.stopListening?.();
    setFounderIdle();
    setPhase("loading");

    const minDelay = new Promise((resolve) => window.setTimeout(resolve, 2800));
    const [response] = await Promise.all([
      fetch("/api/onboarding/founder/rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: profileRef.current }),
      }),
      minDelay,
    ]);

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setPhase("chat");
      setMessages((current) => [
        ...current,
        { role: "founder", text: payload.error ?? "Ranking fehlgeschlagen — erzähl mir noch etwas." },
      ]);
      return;
    }

    setRankedGroups(payload.rankedGroups ?? []);
    if (userId && payload.profilePatch) {
      await saveOwnProfile(supabase, userId, payload.profilePatch).catch(() => {});
    }
    setPhase("staircase");
  }, [setFounderIdle, supabase, userId]);

  async function handleJoinGroup(group) {
    if (!group?.id || joinedSlugs[group.slug]) return;
    setJoiningSlug(group.slug);
    try {
      const response = await fetch(`/api/communities/${group.id}/join`, { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Beitritt fehlgeschlagen.");
      setJoinedSlugs((prev) => ({ ...prev, [group.slug]: true }));
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: "founder", text: error.message ?? "Beitritt gerade nicht möglich." },
      ]);
    } finally {
      setJoiningSlug("");
    }
  }

  function handleTextSubmit(event) {
    event.preventDefault();
    sendUserMessage(textInput);
  }

  function skipOnboarding() {
    stopFounderSpeech();
    setFounderIdle();
    if (userId) writeOnboardingSkipped(userId);
    router.push("/dashboard");
  }

  function finishOnboarding() {
    stopFounderSpeech();
    setFounderIdle();
    if (userId) writeOnboardingComplete(userId);
    router.push("/dashboard");
  }

  const userMessageCount = messages.filter((message) => message.role === "user").length;
  const canRank = (readyForRanking || userMessageCount >= 2) && !chatLoading && !isSpeaking;

  const visibleMessages = voiceMode ? messages.filter((message) => message.role === "user") : messages;

  const chatPanel = (
    <CockpitPanel
      className={`relative flex flex-col overflow-hidden backdrop-blur-md ${
        voiceMode
          ? "border-[#1a3aad]/25 bg-[#050505]/75 shadow-[0_-8px_40px_rgba(0,0,0,0.5)]"
          : "min-h-[min(72dvh,720px)] bg-[#050505]/55 sm:min-h-[520px]"
      }`}
    >
      <AnimatePresence mode="wait">
        {phase === "chat" && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col"
          >
            <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5b8cff]">Phase 1</p>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={disableVoiceMode}
                  className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                    !voiceMode ? "bg-[#1a3aad] text-white" : "bg-white/5 text-neutral-400"
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Text
                </button>
                <button
                  type="button"
                  disabled={!speechSupported}
                  onClick={enableVoiceMode}
                  className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold disabled:opacity-40 ${
                    voiceMode ? "bg-[#1a3aad] text-white" : "bg-white/5 text-neutral-400"
                  }`}
                >
                  <Mic className="h-3.5 w-3.5" />
                  Kugel
                </button>
              </div>
            </div>

            <div
              className={`space-y-2 overflow-y-auto overscroll-contain pr-0.5 [-webkit-overflow-scrolling:touch] ${
                voiceMode ? "max-h-[18vh] sm:max-h-[20vh]" : "min-h-0 flex-1 max-h-[min(40vh,360px)]"
              }`}
            >
              {visibleMessages.length === 0 && voiceMode && !chatLoading && (
                <p className="text-center text-xs text-neutral-500">Deine Antworten erscheinen hier</p>
              )}
              {visibleMessages.map((message, index) => (
                <ChatBubble key={`${message.role}-${index}`} message={message} />
              ))}
              {chatLoading && (
                <div className="mr-auto flex items-center gap-2 rounded-2xl bg-[#1a3aad]/10 px-3 py-2 text-sm text-neutral-400">
                  <Loader2 className="h-4 w-4 animate-spin text-[#5b8cff]" />
                  Founder denkt…
                </div>
              )}
              <div ref={chatEndRef} className="h-px" />
            </div>

            <div className="mt-2 shrink-0 space-y-2 border-t border-white/8 pt-2">
              {!voiceMode && (
                <form onSubmit={handleTextSubmit} className="flex gap-2">
                  <input
                    value={textInput}
                    onChange={(event) => setTextInput(event.target.value)}
                    placeholder="Erzähl Founder von dir…"
                    disabled={chatLoading}
                    className="min-h-[44px] flex-1 rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-base text-white outline-none ring-[#1a3aad] focus:ring-2 disabled:opacity-50 sm:text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!textInput.trim() || chatLoading}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-[#1a3aad] text-white disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              )}

              <div className="flex items-center justify-between gap-2 pb-[env(safe-area-inset-bottom)]">
                <button type="button" onClick={skipOnboarding} className="min-h-[44px] px-2 text-sm text-neutral-500">
                  Später
                </button>
                <button
                  type="button"
                  disabled={!canRank}
                  onClick={runRanking}
                  className="min-h-[44px] rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-40"
                >
                  Meine Top-Nischen
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {phase === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <FounderStaircaseLoading />
          </motion.div>
        )}

        {phase === "staircase" && (
          <motion.div key="staircase" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <FounderNicheStaircase
              groups={rankedGroups}
              onJoin={handleJoinGroup}
              joiningSlug={joiningSlug}
              joinedSlugs={joinedSlugs}
            />
            <div className="flex items-center justify-between gap-2 border-t border-white/8 pt-4">
              <button type="button" onClick={skipOnboarding} className="text-sm text-neutral-500">
                Später
              </button>
              <button
                type="button"
                onClick={finishOnboarding}
                className="min-h-[44px] rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black"
              >
                Zum Dashboard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CockpitPanel>
  );

  if (voiceMode && phase === "chat") {
    return (
      <div className="fixed inset-x-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-20 sm:inset-x-4">
        {chatPanel}
      </div>
    );
  }

  return (
    <CockpitPage
      compact
      eyebrow={voiceMode ? undefined : "Founder AI"}
      title={voiceMode ? undefined : "Dein persönlicher Start"}
      description={voiceMode ? undefined : "Erzähl Founder von dir."}
      className="min-h-0 flex-1 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
    >
      {chatPanel}
    </CockpitPage>
  );
}
