"use client";

import { motion } from "framer-motion";

export function FadeIn({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function MotionCard({ children, className = "" }) {
  return (
    <motion.div whileHover={{ y: -6 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} className={className}>
      {children}
    </motion.div>
  );
}
