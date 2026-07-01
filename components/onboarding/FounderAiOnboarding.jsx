"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare, Mic, Send, Sparkles, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CockpitPage, CockpitPanel } from "@/components/cockpit/CockpitPage";
import {
  founderSpeak,
  typeFounderMessage,
  useFounderGlobe,
} from "@/components/cockpit/FounderGlobeContext";
import { FounderGlobeMessage } from "@/components/onboarding/FounderGlobeMessage";
import { useFounderSpeechInput } from "@/hooks/useFounderSpeechInput";
import {
  FOUNDER_GREETING,
  FOUNDER_QUESTIONS,
  readOnboardingComplete,
  writeOnboardingComplete,
  writeOnboardingSkipped,
} from "@/lib/founder-ai-onboarding";
import {
  fetchFounderVoiceStatus,
  invalidateFounderVoiceCache,
  isMediaRecorderSupported,
  stopFounderSpeech,
} from "@/lib/founder-voice";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { saveOwnProfile } from "@/lib/profiles";

const LOADING_MESSAGES = [
  "Founder analysiert deine Antworten…",
  "Communities werden gematcht…",
  "Dein Podium wird aufgebaut…",
];

function isHiFounderTrigger(value) {
  const text = String(value ?? "").toLowerCase().trim();
  return /hi\s*founder|hallo\s*founder|hey\s*founder/.test(text) || text === "founder";
}

function PodiumCard({ group, rank, onJoin, joining, joined }) {
  const heights = { 1: "md:min-h-[220px]", 2: "md:min-h-[180px]", 3: "md:min-h-[160px]" };
  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
  const order = rank === 1 ? "order-2" : rank === 2 ? "order-1" : "order-3";

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.12 }}
      className={`flex flex-1 flex-col rounded-2xl border bg-gradient-to-b p-4 ${order} ${
        rank === 1
          ? "border-amber-400/40 from-amber-500/15 to-[#0a0a0a] shadow-[0_0_40px_rgba(251,191,36,0.12)]"
          : "border-[#1a3aad]/30 from-[#1a3aad]/10 to-[#0a0a0a]"
      } ${heights[rank] ?? ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-2xl">{medals[rank]}</span>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-400">
          #{rank}
        </span>
      </div>
      <h3 className="mt-3 font-serif text-lg font-bold text-white">{group.name}</h3>
      <p className="mt-1 text-xs text-[#5b8cff]">{group.category}</p>
      <p className="mt-2 flex-1 text-sm leading-6 text-neutral-400">{group.coachTip}</p>
      <button
        type="button"
        disabled={joining || joined}
        onClick={() => onJoin(group)}
        className="mt-4 w-full rounded-xl bg-[#1a3aad] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2448c7] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {joined ? "Beigetreten ✓" : joining ? "Beitritt…" : "Community beitreten"}
      </button>
    </motion.article>
  );
}

export function FounderAiOnboarding() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [userId, setUserId] = useState("");
  const [step, setStep] = useState("trigger");
  const [mode, setMode] = useState("text");
  const [triggerInput, setTriggerInput] = useState("");
  const [triggerVoiceActive, setTriggerVoiceActive] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({ who: "", what: "", goals: "", context: "" });
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [rankedGroups, setRankedGroups] = useState([]);
  const [joinedSlugs, setJoinedSlugs] = useState({});
  const [joiningSlug, setJoiningSlug] = useState("");
  const [coachQuestion, setCoachQuestion] = useState("");
  const [coachMessages, setCoachMessages] = useState([
    { role: "founder", text: "Frag mich jederzeit, was du als Nächstes machen sollst — z. B. deine erste Nachricht in einer Gruppe." },
  ]);
  const [coachLoading, setCoachLoading] = useState(false);
  const [voiceApiReady, setVoiceApiReady] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const globe = useFounderGlobe();
  const {
    activity: globeActivity,
    bumpFlow,
    isFlowCurrent,
    setFounderIdle,
    setFounderSpeaking,
    setFounderListening,
    setFounderTyping,
    setFounderThinking,
  } = globe;
  const processingVoiceRef = useRef(false);
  const questionIndexRef = useRef(0);
  const answersRef = useRef(answers);
  const stepRef = useRef(step);

  const currentQuestion = FOUNDER_QUESTIONS[questionIndex];
  const isVoiceMode = mode === "voice";
  const founderBusy = ["speaking", "typing", "thinking"].includes(globeActivity);
  const voiceInputEnabled =
    isVoiceMode && ((step === "trigger" && triggerVoiceActive) || step === "interview");

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    questionIndexRef.current = questionIndex;
  }, [questionIndex]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

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

  const submitAnswer = useCallback((rawValue) => {
    const value = String(rawValue ?? "").trim();
    const question = FOUNDER_QUESTIONS[questionIndexRef.current];
    if (!value || !question || processingVoiceRef.current) return;

    processingVoiceRef.current = true;

    const nextAnswers = { ...answersRef.current, [question.id]: value };
    setAnswers(nextAnswers);
    setCurrentAnswer("");

    if (questionIndexRef.current >= FOUNDER_QUESTIONS.length - 1) {
      runAnalysisRef.current?.(nextAnswers);
    } else {
      setQuestionIndex((index) => index + 1);
    }

    window.setTimeout(() => {
      processingVoiceRef.current = false;
    }, 2500);
  }, []);

  const runAnalysisRef = useRef(null);

  const runAnalysis = useCallback(
    async (finalAnswers) => {
      const payloadAnswers = finalAnswers ?? answers;
      stopFounderSpeech();
      setFounderThinking("Ich analysiere deine Antworten und baue dein Podium…");
      setStep("loading");
      const minDelay = new Promise((resolve) => window.setTimeout(resolve, 2400));

      const [response] = await Promise.all([
        fetch("/api/onboarding/founder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: payloadAnswers }),
        }),
        minDelay,
      ]);

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStep("interview");
        return;
      }

      setRankedGroups(payload.rankedGroups ?? []);

      if (userId && payload.profilePatch) {
        await saveOwnProfile(supabase, userId, payload.profilePatch).catch(() => {});
      }

      setCoachMessages((messages) => [
        ...messages,
        {
          role: "founder",
          text: `Dein Podium steht. Starte mit ${payload.rankedGroups?.[0]?.name ?? "deiner Top-Community"} — ich helfe dir beim ersten Schritt.`,
        },
      ]);
      setFounderIdle();
      setStep("podium");
    },
    [answers, setFounderIdle, setFounderThinking, supabase, userId]
  );

  runAnalysisRef.current = runAnalysis;

  const handleSpeechComplete = useCallback(
    (text) => {
      if (stepRef.current === "trigger") {
        if (!isHiFounderTrigger(text)) {
          setFounderListening('Sag „Hi Founder“, um zu starten.');
          return;
        }
        setTriggerVoiceActive(false);
        setTriggerInput(text);
        setStep("greeting");
        return;
      }

      if (stepRef.current === "interview") {
        setCurrentAnswer(text);
        submitAnswer(text);
      }
    },
    [setFounderListening, submitAnswer]
  );

  const speech = useFounderSpeechInput({
    enabled: voiceInputEnabled,
    paused: founderBusy,
    onTranscriptComplete: handleSpeechComplete,
  });

  useEffect(() => {
    if (!isVoiceMode || step !== "interview") return;
    setCurrentAnswer(speech.liveTranscript);
  }, [isVoiceMode, speech.liveTranscript, step]);

  useEffect(() => {
    if (step !== "greeting") return undefined;

    const generation = bumpFlow();

    async function greet() {
      await typeFounderMessage(setFounderTyping, FOUNDER_GREETING, {
        isCancelled: () => !isFlowCurrent(generation),
      });
      if (isFlowCurrent(generation)) setFounderIdle();
    }

    greet();
    return undefined;
  }, [bumpFlow, isFlowCurrent, setFounderIdle, setFounderTyping, step]);

  useEffect(() => {
    if (isVoiceMode || step !== "interview" || !currentQuestion) return undefined;

    const generation = bumpFlow();

    async function askInText() {
      await typeFounderMessage(setFounderTyping, `${currentQuestion.label} ${currentQuestion.hint}`, {
        isCancelled: () => !isFlowCurrent(generation),
      });
      if (isFlowCurrent(generation)) setFounderIdle();
    }

    askInText();
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bumpFlow, isFlowCurrent, isVoiceMode, setFounderIdle, setFounderTyping, step, questionIndex, currentQuestion?.id]);

  useEffect(() => {
    if (!isVoiceMode || step !== "interview" || !currentQuestion) return undefined;

    const generation = bumpFlow();

    async function askQuestion() {
      speech.resetTranscript();
      setCurrentAnswer("");

      await founderSpeak(
        setFounderSpeaking,
        setFounderListening,
        `${currentQuestion.voiceHint}. Sprich einfach los — ich erkenne automatisch, wenn du fertig bist.`,
        { isCancelled: () => !isFlowCurrent(generation) }
      );
    }

    askQuestion();
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bumpFlow, isFlowCurrent, isVoiceMode, setFounderListening, setFounderSpeaking, step, questionIndex, currentQuestion?.id]);

  useEffect(() => {
    if (step !== "loading") return undefined;

    const interval = window.setInterval(() => {
      setLoadingMessageIndex((index) => (index + 1) % LOADING_MESSAGES.length);
    }, 900);

    return () => window.clearInterval(interval);
  }, [step]);

  useEffect(() => {
    return () => {
      bumpFlow();
      setFounderIdle();
    };
  }, [bumpFlow, setFounderIdle]);

  function handleTriggerSubmit(event) {
    event?.preventDefault?.();
    if (!isHiFounderTrigger(triggerInput)) return;
    setStep("greeting");
  }

  async function handleModeSelect(nextMode) {
    const generation = bumpFlow();
    setMode(nextMode);

    if (nextMode === "voice") {
      await founderSpeak(
        setFounderSpeaking,
        setFounderListening,
        `${FOUNDER_GREETING} Ich stelle dir vier kurze Fragen. Sprich einfach los, wenn ich fertig bin.`,
        { isCancelled: () => !isFlowCurrent(generation) }
      );
      if (isFlowCurrent(generation)) setStep("interview");
      return;
    }

    setStep("interview");
  }

  async function startTriggerVoice() {
    if (!speechSupported) return;

    const generation = bumpFlow();
    setMode("voice");
    setTriggerVoiceActive(true);
    await founderSpeak(
      setFounderSpeaking,
      setFounderListening,
      'Sag einfach „Hi Founder“, wenn du bereit bist.',
      { isCancelled: () => !isFlowCurrent(generation) }
    );
  }

  function handleAnswerSubmit(event) {
    event.preventDefault();
    submitAnswer(currentAnswer);
  }

  async function handleJoinGroup(group) {
    if (!group?.id || joinedSlugs[group.slug]) return;
    setJoiningSlug(group.slug);
    try {
      const response = await fetch(`/api/communities/${group.id}/join`, { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Beitritt fehlgeschlagen.");
      setJoinedSlugs((prev) => ({ ...prev, [group.slug]: true }));
      setCoachMessages((messages) => [
        ...messages,
        { role: "founder", text: `Nice — du bist in ${group.name}. ${group.coachTip}` },
      ]);
    } catch (error) {
      setCoachMessages((messages) => [
        ...messages,
        { role: "founder", text: error.message ?? "Beitritt gerade nicht möglich. Versuch es gleich nochmal." },
      ]);
    } finally {
      setJoiningSlug("");
    }
  }

  async function handleCoachSubmit(event) {
    event.preventDefault();
    const question = coachQuestion.trim();
    if (!question) return;

    setCoachMessages((messages) => [...messages, { role: "user", text: question }]);
    setCoachQuestion("");
    setCoachLoading(true);

    try {
      const joinedSlug = Object.keys(joinedSlugs).find((slug) => joinedSlugs[slug]) ?? rankedGroups[0]?.slug ?? "";
      const response = await fetch("/api/onboarding/founder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, question, joined_slug: joinedSlug }),
      });
      const payload = await response.json().catch(() => ({}));
      const reply =
        payload.coachReply ??
        "Tritt einer Community bei und stell dich kurz vor — wer du bist, was du machst, welches Ziel du hast.";
      setCoachMessages((messages) => [...messages, { role: "founder", text: reply }]);
    } finally {
      setCoachLoading(false);
    }
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
  return (
    <>
      <FounderGlobeMessage />

      <CockpitPage
        eyebrow="Founder AI"
        title="Dein persönlicher Start"
        description="Die Kugel im Hintergrund ist Founder — sie pulsiert, wenn er mit dir spricht."
        className="pb-40"
      >
        <CockpitPanel className="relative z-10 overflow-hidden bg-[#050505]/55 backdrop-blur-sm">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#1a3aad]/20 blur-3xl" />

          <AnimatePresence mode="wait">
            {step === "trigger" && (
              <motion.div
                key="trigger"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mx-auto max-w-xl text-center"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1a3aad]/25 text-[#5b8cff]">
                  <Sparkles className="h-8 w-8" />
                </div>
                <p className="mt-6 text-lg text-neutral-300">Sag oder schreib</p>
                <p className="mt-1 font-serif text-3xl font-bold text-white">„Hi Founder“</p>
                <form onSubmit={handleTriggerSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <input
                    value={triggerInput}
                    onChange={(event) => setTriggerInput(event.target.value)}
                    placeholder="Hi Founder"
                    className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none ring-[#1a3aad] focus:ring-2"
                  />
                  <button
                    type="submit"
                    disabled={!isHiFounderTrigger(triggerInput)}
                    className="rounded-xl bg-[#1a3aad] px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    Start
                  </button>
                </form>
                <div className="mt-4 flex flex-col items-center gap-2">
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={startTriggerVoice}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#5b8cff] hover:underline"
                    >
                      <Mic className="h-4 w-4" />
                      Mit Sprache starten
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setTriggerInput("Hi Founder");
                      setStep("greeting");
                    }}
                    className="text-sm text-neutral-500 hover:text-neutral-300"
                  >
                    Direkt loslegen
                  </button>
                </div>
              </motion.div>
            )}

            {step === "greeting" && (
              <motion.div
                key="greeting"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mx-auto max-w-2xl text-center"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5b8cff]">Founder</p>
                <p className="mt-4 font-serif text-2xl leading-relaxed text-white md:text-3xl">{FOUNDER_GREETING}</p>
                <p className="mt-6 text-neutral-400">Wie möchtest du antworten?</p>
                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => handleModeSelect("text")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#1a3aad]/40 bg-[#1a3aad]/15 px-6 py-3 text-sm font-semibold text-white"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Text
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeSelect("voice")}
                    disabled={!speechSupported}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1a3aad] px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    <Mic className="h-4 w-4" />
                    Sprache
                  </button>
                </div>
                {!speechSupported && (
                  <p className="mt-3 text-xs text-amber-300">
                    {voiceApiReady
                      ? "Mikrofon wird in diesem Browser nicht unterstützt — nutze Text."
                      : "Premium-Sprache wird geladen… Falls Sprache grau bleibt: Seite neu laden."}
                  </p>
                )}
                {speechSupported && (
                  <p className="mt-3 text-xs text-neutral-500">
                    Bei Sprache: einfach lossprechen — Founder erkennt automatisch, wenn du fertig bist. Am besten
                    mit Kopfhörer-Mikrofon.
                  </p>
                )}
              </motion.div>
            )}

            {step === "interview" && currentQuestion && (
              <motion.div
                key={`q-${questionIndex}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mx-auto max-w-2xl"
              >
                <div className="mb-6 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Frage {questionIndex + 1} / {FOUNDER_QUESTIONS.length}
                  </p>
                  <div className="flex gap-1">
                    {FOUNDER_QUESTIONS.map((_, index) => (
                      <span
                        key={index}
                        className={`h-1.5 w-8 rounded-full ${index <= questionIndex ? "bg-[#5b8cff]" : "bg-white/10"}`}
                      />
                    ))}
                  </div>
                </div>

                <h2 className="font-serif text-2xl font-bold text-white">{currentQuestion.label}</h2>
                <p className="mt-2 text-sm text-neutral-400">{currentQuestion.hint}</p>

                {isVoiceMode ? (
                  <div className="mt-6 space-y-3">
                    <div className="rounded-xl border border-[#1a3aad]/30 bg-[#0a1020]/80 px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5b8cff]">
                        {globeActivity === "speaking"
                          ? "Founder spricht"
                          : speech.processing
                            ? "Erkenne deine Antwort"
                            : speech.recording
                              ? "Ich höre zu"
                              : globeActivity === "listening"
                                ? "Bereit — sprich los"
                                : "Mikro aktivieren"}
                      </p>
                      <p className="mt-2 min-h-[72px] text-sm leading-6 text-neutral-200">
                        {currentAnswer ||
                          (speech.processing
                            ? "Einen Moment — ich wandle deine Sprache in Text um."
                            : "Sprich einfach los — deine Antwort erscheint hier live.")}
                      </p>
                    </div>
                    {activeMicError && (
                      <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-300">{activeMicError}</p>
                    )}
                    <p className="text-xs text-neutral-500">
                      Kein Knopf nötig: Nach einer kurzen Pause geht es automatisch weiter.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleAnswerSubmit} className="mt-6 space-y-3">
                    <textarea
                      value={currentAnswer}
                      onChange={(event) => setCurrentAnswer(event.target.value)}
                      rows={4}
                      placeholder="Deine Antwort…"
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none ring-[#1a3aad] focus:ring-2"
                    />
                    <button
                      type="submit"
                      disabled={!currentAnswer.trim()}
                      className="w-full rounded-xl bg-[#1a3aad] px-4 py-3 text-sm font-semibold text-white disabled:opacity-40 sm:w-auto"
                    >
                      {questionIndex >= FOUNDER_QUESTIONS.length - 1 ? "Podium erstellen" : "Weiter"}
                    </button>
                  </form>
                )}
              </motion.div>
            )}

            {step === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex min-h-[280px] flex-col items-center justify-center text-center"
              >
                <Loader2 className="h-10 w-10 animate-spin text-[#5b8cff]" />
                <p className="mt-6 font-serif text-xl text-white">{LOADING_MESSAGES[loadingMessageIndex]}</p>
                <p className="mt-2 text-sm text-neutral-500">Gleich siehst du dein Podium.</p>
              </motion.div>
            )}

            {step === "podium" && (
              <motion.div key="podium" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="flex items-center gap-2 text-[#5b8cff]">
                  <Trophy className="h-5 w-5" />
                  <p className="text-sm font-semibold uppercase tracking-wide">Dein Community-Podium</p>
                </div>

                <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-end">
                  {rankedGroups.map((group) => (
                    <PodiumCard
                      key={group.id ?? group.slug}
                      group={group}
                      rank={group.rank}
                      onJoin={handleJoinGroup}
                      joining={joiningSlug === group.slug}
                      joined={Boolean(joinedSlugs[group.slug])}
                    />
                  ))}
                </div>

                <div className="rounded-2xl border border-white/8 bg-black/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Frag Founder</p>
                  <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                    {coachMessages.map((message, index) => (
                      <div
                        key={`${message.role}-${index}`}
                        className={`rounded-xl px-3 py-2 text-sm leading-6 ${
                          message.role === "founder"
                            ? "bg-[#1a3aad]/15 text-neutral-200"
                            : "ml-8 bg-white/5 text-neutral-300"
                        }`}
                      >
                        {message.text}
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleCoachSubmit} className="mt-3 flex gap-2">
                    <input
                      value={coachQuestion}
                      onChange={(event) => setCoachQuestion(event.target.value)}
                      placeholder="Was muss ich als Erstes in Reselling machen?"
                      className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none ring-[#1a3aad] focus:ring-2"
                    />
                    <button
                      type="submit"
                      disabled={coachLoading || !coachQuestion.trim()}
                      className="inline-flex items-center justify-center rounded-xl bg-[#1a3aad] px-3 py-2.5 text-white disabled:opacity-40"
                    >
                      {coachLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </form>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4">
                  <button
                    type="button"
                    onClick={skipOnboarding}
                    className="text-sm text-neutral-500 hover:text-neutral-300"
                  >
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
