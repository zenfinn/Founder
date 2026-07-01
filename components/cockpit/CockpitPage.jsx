"use client";

import { motion } from "framer-motion";

export function CockpitPage({ eyebrow, title, description, children, className = "", compact = false }) {
  return (
    <div className={`mx-auto flex w-full max-w-7xl flex-col px-3 sm:px-4 md:px-6 ${className}`}>
      <div className="grid auto-rows-min gap-3 md:gap-4">
        {(eyebrow || title || description) && (
          <motion.header
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className={`rounded-2xl border border-[#1a3aad]/30 bg-[#0f0f0f]/75 backdrop-blur-sm ${
              compact ? "p-4 md:p-6" : "p-5 md:p-7"
            }`}
          >
            {eyebrow && (
              <p
                className={`font-semibold uppercase tracking-[0.2em] text-neutral-500 ${
                  compact ? "text-[10px]" : "text-[11px] tracking-[0.24em]"
                }`}
              >
                {eyebrow}
              </p>
            )}
            {title && (
              <h1
                className={`mt-1.5 font-serif font-bold tracking-tight text-white ${
                  compact ? "text-xl sm:text-2xl md:text-3xl" : "mt-2 text-2xl md:text-4xl"
                }`}
              >
                {title}
              </h1>
            )}
            {description && (
              <p
                className={`max-w-3xl leading-6 text-neutral-400 ${
                  compact ? "mt-2 hidden text-sm sm:block" : "mt-3 text-sm"
                }`}
              >
                {description}
              </p>
            )}
          </motion.header>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-4"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

export function CockpitPanel({ children, className = "", span = "" }) {
  return (
    <section
      className={`rounded-2xl border border-[#1a3aad]/30 bg-[#0f0f0f]/80 p-4 backdrop-blur-sm sm:p-5 md:p-6 ${span} ${className}`}
    >
      {children}
    </section>
  );
}
