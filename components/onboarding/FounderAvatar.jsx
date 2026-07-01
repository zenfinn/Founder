"use client";

import { motion, AnimatePresence } from "framer-motion";

function SoundBars({ active }) {
  return (
    <div className="flex h-5 items-end justify-center gap-1">
      {[0, 1, 2, 3].map((index) => (
        <motion.span
          key={index}
          className="w-1 rounded-full bg-[#5b8cff]"
          animate={
            active
              ? { height: [6, 16, 8, 18, 6], opacity: [0.5, 1, 0.7, 1, 0.5] }
              : { height: 6, opacity: 0.35 }
          }
          transition={{
            duration: 0.9,
            repeat: active ? Infinity : 0,
            delay: index * 0.12,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export function FounderAvatar({ visible = true, speaking = false, listening = false, message = "" }) {
  const pulse = speaking || listening;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 12 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 md:bottom-28"
        >
          <div className="flex w-full max-w-md flex-col items-center">
            {message && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 w-full rounded-2xl border border-[#1a3aad]/40 bg-[#0b1024]/95 px-4 py-3 text-center text-sm leading-6 text-neutral-100 shadow-[0_0_40px_rgba(26,58,173,0.35)] backdrop-blur-md"
              >
                {message}
              </motion.div>
            )}

            <div className="relative">
              {pulse && (
                <motion.span
                  className="absolute inset-0 rounded-full bg-[#1a3aad]/30"
                  animate={{ scale: [1, 1.35, 1], opacity: [0.45, 0, 0.45] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                />
              )}

              <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-[#5b8cff]/50 bg-gradient-to-br from-[#1a3aad] to-[#0a1440] shadow-[0_0_50px_rgba(91,140,255,0.45)]">
                <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden>
                  <path
                    d="M18 44 L32 14 L46 44 Z"
                    fill="none"
                    stroke="#dbeafe"
                    strokeWidth="4"
                    strokeLinejoin="round"
                  />
                  <path d="M26 36 H38" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="27" cy="30" r="2.5" fill="#eff6ff" />
                  <circle cx="37" cy="30" r="2.5" fill="#eff6ff" />
                  <path
                    d="M32 44 L44 52"
                    stroke="#5b8cff"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            <div className="mt-3 flex flex-col items-center gap-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5b8cff]">Founder</p>
              <SoundBars active={speaking || listening} />
              <p className="text-xs text-neutral-400">
                {speaking ? "Founder spricht…" : listening ? "Ich höre zu — sprich einfach los" : "Bereit"}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
