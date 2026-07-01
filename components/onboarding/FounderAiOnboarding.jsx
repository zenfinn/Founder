"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare, Mic, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CockpitPage, CockpitPanel } from "@/components/cockpit/CockpitPage";
import {
  founderSpeak,
  useFounderGlobe,
} from "@/components/cockpit/FounderGlobeContext";
import { FounderGlobeMessage } from "@/components/onboarding/FounderGlobeMessage";
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
import {
  fetchFounderVoiceStatus,
  invalidateFounderVoiceCache,
  isMediaRecorderSupported,
  stopFounderSpeech,
} from "@/lib/founder-voice";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { saveOwnProfile } from "@/lib/profiles";

function ChatBubble({ message }) {
  const isFounder = message.role === "founder";
  return (
    <div
      className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${
        isFounder
          ? "mr-auto bg-[#1a3aad]/20 text-neutral-100"
          : "ml-auto bg-white/8 text-neutral-200"
      }`}
    >
      {message.text}
    </div>
  );
}

export function FounderAiOnboarding() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [userId, setUserId] = useState("");
  const [phase, setPhase] = useState("chat");
  const [voiceMode, setVoiceMode] = useState(false);
  const [messages, setMessages] = useState([]);
  const [profile, setProfile] = useState({});
  const [readyForRanking, setReadyForRanking] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [openingDone, setOpeningDone] = useState(false);
  const [rankedGroups, setRankedGroups] = useState([]);
  const [joinedSlugs, setJoinedSlugs] = useState({});
  const [joiningSlug, setJoiningSlug] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceApiReady, setVoiceApiReady] = useState(false);
  const [voiceChecked, setVoiceChecked] = useState(false);

  const globe = useFounderGlobe();
  const {
    activity: globeActivity,
    bumpFlow,
    isFlowCurrent,
    setFounderIdle,
    setFounderSpeaking,
    setFounderListening,
    setFounderThinking,
  } = globe;

  const messagesRef = useRef(messages);
  const profileRef = useRef(profile);
  const phaseRef = useRef(phase);
  const processingVoiceRef = useRef(false);
  const chatEndRef = useRef(null);

  const founderBusy = ["speaking", "typing", "thinking"].includes(globeActivity);
  const voiceInputEnabled = voiceMode && phase === "chat" && openingDone;

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
    invalidateFounderVoiceCache();
    fetchFounderVoiceStatus({ force: true }).then((apiReady) => {
      setVoiceApiReady(apiReady);
      const supported = apiReady && isMediaRecorderSupported();
      setSpeechSupported(supported);
      if (supported) setVoiceMode(true);
      setVoiceChecked(true);
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
      if (readOnboardingComplete(user.id)) {
        router.replace("/dashboard");
        return;
      }
      setUserId(user.id);
    }

    loadUser();
    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  const speakFounderReply = useCallback(
    async (text) => {
      const generation = bumpFlow();
      if (voiceMode) {
        await founderSpeak(setFounderSpeaking, setFounderListening, text, {
          isCancelled: () => !isFlowCurrent(generation),
        });
      }
      if (isFlowCurrent(generation)) setFounderIdle();
    },
    [bumpFlow, isFlowCurrent, setFounderIdle, setFounderListening, setFounderSpeaking, voiceMode]
  );

  const sendUserMessage = useCallback(
    async (rawText, { skipUserBubble = false } = {}) => {
      const text = String(rawText ?? "").trim();
      if (!text || chatLoading || phaseRef.current !== "chat") return;

      const userMessage = { role: "user", text };
      const nextMessages = skipUserBubble ? messagesRef.current : [...messagesRef.current, userMessage];

      if (!skipUserBubble) {
        setMessages(nextMessages);
        setTextInput("");
      }

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

        const founderMessage = { role: "founder", text: payload.reply };
        setMessages((current) => [...current, founderMessage]);
        setProfile(payload.profile ?? {});
        setReadyForRanking(Boolean(payload.readyForRanking));

        setFounderIdle();
        await speakFounderReply(payload.reply);
      } catch (error) {
        setMessages((current) => [
          ...current,
          { role: "founder", text: error.message ?? "Kurz technisches Problem — versuch es nochmal." },
        ]);
        setFounderIdle();
      } finally {
        setChatLoading(false);
      }
    },
    [chatLoading, setFounderIdle, setFounderThinking, speakFounderReply]
  );

  const handleSpeechComplete = useCallback(
    (text) => {
      if (processingVoiceRef.current || phaseRef.current !== "chat") return;
      const value = String(text ?? "").trim();
      if (!value) return;

      processingVoiceRef.current = true;
      sendUserMessage(value).finally(() => {
        window.setTimeout(() => {
          processingVoiceRef.current = false;
        }, 1200);
      });
    },
    [sendUserMessage]
  );

  const speech = useFounderSpeechInput({
    enabled: voiceInputEnabled,
    paused: founderBusy || chatLoading,
    onTranscriptComplete: handleSpeechComplete,
  });

  useEffect(() => {
    if (!voiceMode || openingDone) return;
    setTextInput(speech.liveTranscript);
  }, [openingDone, speech.liveTranscript, voiceMode]);

  useEffect(() => {
    if (!voiceChecked || openingDone) return undefined;

    const generation = bumpFlow();
    const opening = getJarvisOpeningMessage();
    setMessages([{ role: "founder", text: opening }]);

    async function playOpening() {
      if (voiceMode) {
        await founderSpeak(setFounderSpeaking, setFounderListening, opening, {
          isCancelled: () => !isFlowCurrent(generation),
        });
      }
      if (isFlowCurrent(generation)) {
        setFounderIdle();
        setOpeningDone(true);
      }
    }

    playOpening();
    return undefined;
  }, [
    bumpFlow,
    isFlowCurrent,
    openingDone,
    setFounderIdle,
    setFounderListening,
    setFounderSpeaking,
    voiceChecked,
    voiceMode,
  ]);

  useEffect(() => {
    return () => {
      bumpFlow();
      setFounderIdle();
    };
  }, [bumpFlow, setFounderIdle]);

  const runRanking = useCallback(async () => {
    stopFounderSpeech();
    setFounderThinking("Ich analysiere dein Profil und baue dein Treppchen…");
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
      setFounderIdle();
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
    setFounderIdle();
    setPhase("staircase");
  }, [setFounderIdle, setFounderThinking, supabase, userId]);

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

  const activeMicError = speech.micError;
  const canRank = readyForRanking && !chatLoading;

  return (
    <>
      <FounderGlobeMessage />

      <CockpitPage
        eyebrow="Founder AI"
        title="Dein persönlicher Start"
        description="Founder hört zu, matcht deine Nischen — die Kugel pulsiert, wenn er spricht."
        className="pb-40"
      >
        <CockpitPanel className="relative z-10 overflow-hidden bg-[#050505]/55 backdrop-blur-sm">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#1a3aad]/20 blur-3xl" />

          <AnimatePresence mode="wait">
            {phase === "chat" && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex min-h-[420px] flex-col"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5b8cff]">Phase 1 — Gespräch</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setVoiceMode(false)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        !voiceMode ? "bg-[#1a3aad] text-white" : "bg-white/5 text-neutral-400"
                      }`}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Text
                    </button>
                    <button
                      type="button"
                      disabled={!speechSupported}
                      onClick={() => setVoiceMode(true)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40 ${
                        voiceMode ? "bg-[#1a3aad] text-white" : "bg-white/5 text-neutral-400"
                      }`}
                    >
                      <Mic className="h-3.5 w-3.5" />
                      Sprache
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto pr-1" style={{ maxHeight: "min(52vh, 420px)" }}>
                  {messages.map((message, index) => (
                    <ChatBubble key={`${message.role}-${index}`} message={message} />
                  ))}
                  {chatLoading && (
                    <div className="mr-auto flex items-center gap-2 rounded-2xl bg-[#1a3aad]/10 px-4 py-3 text-sm text-neutral-400">
                      <Loader2 className="h-4 w-4 animate-spin text-[#5b8cff]" />
                      Founder denkt…
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {voiceMode ? (
                  <div className="mt-4 space-y-3 border-t border-white/8 pt-4">
                    <div className="rounded-xl border border-[#1a3aad]/30 bg-[#0a1020]/80 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5b8cff]">
                        {globeActivity === "speaking"
                          ? "Founder spricht"
                          : speech.processing
                            ? "Erkenne deine Antwort"
                            : speech.recording
                              ? "Ich höre zu"
                              : globeActivity === "listening"
                                ? "Bereit — erzähl von dir"
                                : "Mikro aktiv"}
                      </p>
                      <p className="mt-2 min-h-[48px] text-sm leading-6 text-neutral-200">
                        {textInput ||
                          (speech.processing
                            ? "Einen Moment — ich wandle deine Sprache um."
                            : "Sprich einfach los — Name, Alter, Ausbildung, Ziele, Interessen.")}
                      </p>
                    </div>
                    {activeMicError && (
                      <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-300">{activeMicError}</p>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleTextSubmit} className="mt-4 flex gap-2 border-t border-white/8 pt-4">
                    <input
                      value={textInput}
                      onChange={(event) => setTextInput(event.target.value)}
                      placeholder="Erzähl Founder von dir…"
                      disabled={chatLoading || !openingDone}
                      className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none ring-[#1a3aad] focus:ring-2 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!textInput.trim() || chatLoading || !openingDone}
                      className="inline-flex items-center justify-center rounded-xl bg-[#1a3aad] px-4 py-3 text-white disabled:opacity-40"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <button type="button" onClick={skipOnboarding} className="text-sm text-neutral-500 hover:text-neutral-300">
                    Später
                  </button>
                  <button
                    type="button"
                    disabled={!canRank}
                    onClick={runRanking}
                    className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Meine Top-Nischen
                  </button>
                </div>
                {!speechSupported && voiceMode && (
                  <p className="mt-2 text-xs text-amber-300">
                    {voiceApiReady ? "Mikrofon nicht verfügbar — nutze Text." : "Sprache wird geladen…"}
                  </p>
                )}
              </motion.div>
            )}

            {phase === "loading" && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <FounderStaircaseLoading />
              </motion.div>
            )}

            {phase === "staircase" && (
              <motion.div
                key="staircase"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <FounderNicheStaircase
                  groups={rankedGroups}
                  onJoin={handleJoinGroup}
                  joiningSlug={joiningSlug}
                  joinedSlugs={joinedSlugs}
                />

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4">
                  <button type="button" onClick={skipOnboarding} className="text-sm text-neutral-500 hover:text-neutral-300">
                    Später
                  </button>
                  <button
                    type="button"
                    onClick={finishOnboarding}
                    className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black"
                  >
                    Zum Dashboard
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CockpitPanel>
      </CockpitPage>
    </>
  );
}
