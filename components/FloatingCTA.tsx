"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/** Mobile-only floating "Join the Charge" button — appears after the hero. */
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
          className="fixed bottom-5 right-4 z-40 flex items-center gap-2 bg-crimson px-5 py-3.5 font-display text-xs uppercase tracking-wider text-bone shadow-crimson-glow md:hidden [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)]"
        >
          🐂 Join the Charge
        </motion.button>
      )}
    </AnimatePresence>
  );
}
