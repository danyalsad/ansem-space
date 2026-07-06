"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function FloatingCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          onClick={() => document.getElementById("charge")?.scrollIntoView({ behavior: "smooth" })}
          className="fixed bottom-6 right-4 z-40 flex items-center gap-2 rounded-full bg-crimson px-5 py-3.5 text-sm font-semibold text-bone shadow-crimson-glow md:hidden"
        >
          🐂 Play Arcade
        </motion.button>
      )}
    </AnimatePresence>
  );
}