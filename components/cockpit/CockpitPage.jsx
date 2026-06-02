"use client";

import { motion } from "framer-motion";

export function CockpitPage({ eyebrow, title, description, children, className = "" }) {
  return (
    <div className={`mx-auto max-w-7xl px-4 md:px-6 ${className}`}>
      <div className="grid auto-rows-min gap-4">
        {(eyebrow || title || description) && (
          <motion.header
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-[#1a3aad]/30 bg-[#0f0f0f]/75 p-6 backdrop-blur-sm md:p-7"
          >
            {eyebrow && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-500">{eyebrow}</p>
            )}
            {title && (
              <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-white md:text-4xl">{title}</h1>
            )}
            {description && <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-400">{description}</p>}
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
      className={`rounded-2xl border border-[#1a3aad]/30 bg-[#0f0f0f]/80 p-5 backdrop-blur-sm md:p-6 ${span} ${className}`}
    >
      {children}
    </section>
  );
}
