"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useFounderGlobe } from "@/components/cockpit/FounderGlobeContext";

export function FounderGlobeMessage() {
  const { activity, message } = useFounderGlobe();
  const visible = Boolean(message) && activity !== "idle";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
          className="pointer-events-none fixed inset-x-0 top-[24vh] z-30 flex justify-center px-4 md:top-[26vh]"
        >
          <div className="relative max-w-xl">
            <div className="rounded-2xl border border-[#5b8cff]/45 bg-[#070d22]/92 px-5 py-4 text-center text-sm leading-7 text-neutral-100 shadow-[0_0_60px_rgba(26,58,173,0.45)] backdrop-blur-md">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#5b8cff]">Founder</p>
              <p className="mt-2 font-medium">
                {message}
                {(activity === "typing" || activity === "thinking") && (
                  <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-[#5b8cff]" />
                )}
              </p>
            </div>
            <div className="mx-auto mt-2 h-3 w-3 rotate-45 border-b border-r border-[#5b8cff]/45 bg-[#070d22]/92" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
