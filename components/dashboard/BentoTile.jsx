"use client";

import { motion } from "framer-motion";

export function BentoTile({
  children,
  className = "",
  delay = 0,
  parallax = { x: 0, y: 0 },
  depth = 4,
  compact = false,
}) {
  const offsetX = parallax.x * depth;
  const offsetY = parallax.y * depth;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      <div style={{ transform: `translate(${offsetX}px, ${offsetY}px)` }}>
        <div
          className={`flex h-full flex-col rounded-xl border border-[#1a3aad]/30 bg-[#0f0f0f] transition-colors hover:border-[#1a3aad]/70 ${
            compact ? "p-3" : "rounded-2xl p-5"
          }`}
        >
          {children}
        </div>
      </div>
    </motion.div>
  );
}
