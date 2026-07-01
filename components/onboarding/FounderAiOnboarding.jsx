"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  fetchFounderVoiceStatus,
  invalidateFounderVoiceCache,
  isMediaRecorderSupported,
  speakFounderText,
  stopFounderSpeech,
} from "@/lib/founder-voice";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { saveOwnProfile } from "@/lib/profiles";

function ChatBubble({ message }) {
  const isFounder = message.role === "founder";
  return (
    <div
      className={`max-w-[92%] rounded-2xl px-3.5 py-3 text-[15px] leading-6 sm:max-w-[88%] sm:px-4 sm:text-sm ${
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [rankedGroups, setRankedGroups] = useState([]);
  const [joinedSlugs, setJoinedSlugs] = useState({});
  const [joiningSlug, setJoiningSlug] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceApiReady, setVoiceApiReady] = useState(false);

  const { setFounderIdle, setFounderSpeaking } = useFounderGlobe();

  const messagesRef = useRef(messages);
  const profileRef = useRef(profile);
  const phaseRef = useRef(phase);
  const processingVoiceRef = useRef(false);
  const chatEndRef = useRef(null);
  const openingStartedRef = useRef(false);
  const speechRef = useRef(null);

  const micPaused = chatLoading || isSpeaking;
  const voiceInputEnabled = voiceMode && phase === "chat";

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
      setSpeechSupported(apiReady && isMediaRecorderSupported());
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
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, chatLoading]);

  const playFounderVoice = useCallback(
    async (text) => {
      if (!voiceMode || !text?.trim()) return;
      setIsSpeaking(true);
      setFounderSpeaking("");
      try {
        await speakFounderText(text);
      } catch (error) {
        console.warn("Founder TTS failed", error);
      } finally {
        setFounderIdle();
        setIsSpeaking(false);
      }
    },
    [setFounderIdle, setFounderSpeaking, voiceMode]
  );

  useEffect(() => {
    if (openingStartedRef.current) return;
    openingStartedRef.current = true;

    const opening = getJarvisOpeningMessage();
    setMessages([{ role: "founder", text: opening }]);
    playFounderVoice(opening);
  }, [playFounderVoice]);

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

      const userMessage = { role: "user", text };
      const nextMessages = [...messagesRef.current, userMessage];
      setMessages(nextMessages);
      setTextInput("");
      setChatLoading(true);

      try {
        const response = await fetch("/api/onboarding/founder/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: nextMessages, profile: profileRef.current }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error ?? "Antwort fehlgeschlagen.");

        setMessages((current) => [...current, { role: "founder", text: payload.reply }]);
        setProfile(payload.profile ?? {});
        setReadyForRanking(Boolean(payload.readyForRanking));
        await playFounderVoice(payload.reply);
      } catch (error) {
        const errorText = error.message ?? "Kurz technisches Problem — versuch es nochmal.";
        setMessages((current) => [...current, { role: "founder", text: errorText }]);
      } finally {
        setChatLoading(false);
      }
    },
    [chatLoading, playFounderVoice]
  );

  const handleSpeechComplete = useCallback(
    (text) => {
      if (processingVoiceRef.current || phaseRef.current !== "chat" || micPaused) return;
      const value = String(text ?? "").trim();
      if (!value) return;

      processingVoiceRef.current = true;
      sendUserMessage(value).finally(() => {
        window.setTimeout(() => {
          processingVoiceRef.current = false;
        }, 800);
      });
    },
    [micPaused, sendUserMessage]
  );

  const speech = useFounderSpeechInput({
    enabled: voiceInputEnabled,
    paused: micPaused,
    onTranscriptComplete: handleSpeechComplete,
  });

  speechRef.current = speech;

  useEffect(() => {
    if (!voiceMode) return;
    setTextInput(speech.liveTranscript);
  }, [speech.liveTranscript, voiceMode]);

  function enableVoiceMode() {
    setVoiceMode(true);
    speechRef.current?.startListening?.({ force: true });
  }

  const runRanking = useCallback(async () => {
    stopFounderSpeech();
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

  return (
    <CockpitPage
      compact
      eyebrow="Founder AI"
      title="Dein persönlicher Start"
      description="Erzähl Founder von dir — er matcht dich mit den passenden Nischen."
      className="min-h-0 flex-1 pb-[calc(6.5rem+env(safe-area-inset-bottom))]"
    >
      <CockpitPanel className="relative flex min-h-[min(72dvh,720px)] flex-col overflow-hidden bg-[#050505]/55 backdrop-blur-sm sm:min-h-[520px]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#1a3aad]/20 blur-3xl" />

        <AnimatePresence mode="wait">
          {phase === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5b8cff] sm:text-xs sm:tracking-[0.2em]">
                  Phase 1
                </p>
                <div className="flex gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => setVoiceMode(false)}
                    className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold active:scale-[0.98] ${
                      !voiceMode ? "bg-[#1a3aad] text-white" : "bg-white/5 text-neutral-400"
                    }`}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Text
                  </button>
                  <button
                    type="button"
                    disabled={!speechSupported}
                    onClick={enableVoiceMode}
                    className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold active:scale-[0.98] disabled:opacity-40 ${
                      voiceMode ? "bg-[#1a3aad] text-white" : "bg-white/5 text-neutral-400"
                    }`}
                  >
                    <Mic className="h-4 w-4" />
                    Sprache
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-0.5 [-webkit-overflow-scrolling:touch]">
                {messages.map((message, index) => (
                  <ChatBubble key={`${message.role}-${index}`} message={message} />
                ))}
                {chatLoading && (
                  <div className="mr-auto flex max-w-[92%] items-center gap-2 rounded-2xl bg-[#1a3aad]/10 px-3.5 py-3 text-[15px] text-neutral-400 sm:max-w-[88%] sm:text-sm">
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#5b8cff]" />
                    Founder denkt…
                  </div>
                )}
                <div ref={chatEndRef} className="h-px shrink-0" />
              </div>

              <div className="mt-3 shrink-0 space-y-3 border-t border-white/8 pt-3 pb-[env(safe-area-inset-bottom)]">
                {voiceMode ? (
                  <>
                    <div className="rounded-xl border border-[#1a3aad]/30 bg-[#0a1020]/80 px-3.5 py-3 sm:px-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5b8cff]">
                        {isSpeaking
                          ? "Founder spricht"
                          : speech.processing
                            ? "Erkenne deine Antwort"
                            : speech.recording
                              ? "Ich höre zu"
                              : speech.listening
                                ? "Bereit — sprich los"
                                : "Tippe Sprache, um das Mikro zu starten"}
                      </p>
                      <p className="mt-2 min-h-[44px] text-[15px] leading-6 text-neutral-200 sm:text-sm">
                        {textInput ||
                          (speech.processing
                            ? "Einen Moment — ich wandle deine Sprache um."
                            : "Name, Alter, Ausbildung, Ziele, Interessen.")}
                      </p>
                    </div>
                    {!speech.listening && !speech.micError && speechSupported && (
                      <button
                        type="button"
                        onClick={() => speechRef.current?.startListening?.({ force: true })}
                        className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#1a3aad]/40 bg-[#1a3aad]/15 text-sm font-semibold text-white active:scale-[0.98]"
                      >
                        <Mic className="h-4 w-4" />
                        Mikrofon starten
                      </button>
                    )}
                    {speech.micError && (
                      <p className="rounded-xl bg-red-500/10 px-3 py-2.5 text-xs leading-5 text-red-300">{speech.micError}</p>
                    )}
                  </>
                ) : (
                  <form onSubmit={handleTextSubmit} className="flex gap-2">
                    <input
                      value={textInput}
                      onChange={(event) => setTextInput(event.target.value)}
                      placeholder="Erzähl Founder von dir…"
                      disabled={chatLoading}
                      enterKeyHint="send"
                      autoComplete="off"
                      className="min-h-[44px] flex-1 rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-base text-white outline-none ring-[#1a3aad] focus:ring-2 disabled:opacity-50 sm:px-4 sm:text-sm"
                    />
                    <button
                      type="submit"
                      disabled={!textInput.trim() || chatLoading}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-[#1a3aad] px-4 text-white active:scale-[0.98] disabled:opacity-40"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                )}

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={skipOnboarding}
                    className="min-h-[44px] px-2 text-sm text-neutral-500 active:text-neutral-300"
                  >
                    Später
                  </button>
                  <button
                    type="button"
                    disabled={!canRank}
                    onClick={runRanking}
                    className="min-h-[44px] rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
                  >
                    Meine Top-Nischen
                  </button>
                </div>
                {!speechSupported && voiceMode && (
                  <p className="text-xs leading-5 text-amber-300">
                    {voiceApiReady ? "Mikrofon nicht verfügbar — nutze Text." : "Sprache wird geladen…"}
                  </p>
                )}
              </div>
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
              className="space-y-6 pb-[env(safe-area-inset-bottom)] sm:space-y-8"
            >
              <FounderNicheStaircase
                groups={rankedGroups}
                onJoin={handleJoinGroup}
                joiningSlug={joiningSlug}
                joinedSlugs={joinedSlugs}
              />

              <div className="flex items-center justify-between gap-2 border-t border-white/8 pt-4">
                <button
                  type="button"
                  onClick={skipOnboarding}
                  className="min-h-[44px] px-2 text-sm text-neutral-500"
                >
                  Später
                </button>
                <button
                  type="button"
                  onClick={finishOnboarding}
                  className="min-h-[44px] rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black active:scale-[0.98] sm:px-5"
                >
                  Zum Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CockpitPanel>
    </CockpitPage>
  );
}
