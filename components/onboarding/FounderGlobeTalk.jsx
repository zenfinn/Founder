"use client";

import { motion, AnimatePresence } from "framer-motion";

const STATUS_LABELS = {
  idle: "Tippe die Kugel — sprich mit Founder",
  listening: "Ich höre zu…",
  recording: "Ich höre zu…",
  processing: "Erkenne deine Sprache…",
  speaking: "Founder spricht",
  thinking: "Founder denkt nach…",
};

export function FounderGlobeTalk({
  status = "idle",
  founderText = "",
  liveTranscript = "",
  micError = "",
  onTap,
  disabled = false,
}) {
  const label = STATUS_LABELS[status] ?? STATUS_LABELS.idle;
  const showBubble = Boolean(founderText || liveTranscript);
  const isActive = status === "listening" || status === "speaking" || status === "thinking";

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-[10vh] z-20 flex flex-col items-center px-4 sm:top-[12vh]">
        <AnimatePresence mode="wait">
          {showBubble && (
            <motion.div
              key={founderText || liveTranscript}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6 }}
              className="max-w-md rounded-2xl border border-[#5b8cff]/40 bg-[#070d22]/90 px-4 py-3 text-center shadow-[0_0_48px_rgba(26,58,173,0.35)] backdrop-blur-md"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#5b8cff]">
                {liveTranscript ? "Du" : "Founder"}
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-100">{liveTranscript || founderText}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <p
          className={`mt-3 max-w-xs text-center text-xs font-medium ${
            isActive ? "text-[#5b8cff]" : "text-neutral-400"
          }`}
        >
          {label}
        </p>

        {micError && (
          <p className="pointer-events-auto mt-2 max-w-sm rounded-xl bg-red-500/10 px-3 py-2 text-center text-xs leading-5 text-red-300">
            {micError}
          </p>
        )}
      </div>

      {/* Transparent tap target aligned with the canvas globe (centerY ≈ 42vh) */}
      <button
        type="button"
        disabled={disabled}
        onClick={onTap}
        aria-label={label}
        className={`fixed left-1/2 top-[42vh] z-[15] h-[min(78vw,300px)] w-[min(78vw,300px)] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-transparent bg-transparent transition active:scale-[0.98] ${
          isActive ? "border-[#5b8cff]/25" : ""
        } ${disabled ? "cursor-wait" : "cursor-pointer"}`}
      />
    </>
  );
}
