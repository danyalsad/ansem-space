"use client";

/**
 * Global celebration overlay: listens for the "ansem-bull-charge" event
 * (fired by the logo easter egg and big wins) and stampedes bulls across
 * the viewport with a screen shake.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BullLogo } from "@/components/BullLogo";
import { fireConfetti } from "@/lib/confetti";

export function EffectsLayer() {
  const [charging, setCharging] = useState(false);

  useEffect(() => {
    function onCharge() {
      setCharging(true);
      fireConfetti({ count: 160 });
      setTimeout(() => setCharging(false), 2400);
    }
    window.addEventListener("ansem-bull-charge", onCharge);
    return () => window.removeEventListener("ansem-bull-charge", onCharge);
  }, []);

  return (
    <AnimatePresence>
      {charging && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[999] overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Gold flash */}
          <motion.div
            className="absolute inset-0 bg-gold/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.6 }}
          />
          {/* Stampede of bulls at staggered heights and speeds */}
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{ top: `${14 + i * 17}%` }}
              initial={{ x: "-20vw", scaleX: -1 }}
              animate={{ x: "120vw" }}
              transition={{ duration: 1.1 + i * 0.18, delay: i * 0.12, ease: "easeIn" }}
            >
              <BullLogo glow className="h-16 w-16 sm:h-24 sm:w-24" />
            </motion.div>
          ))}
          <motion.p
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-display text-3xl font-bold text-gold sm:text-6xl"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.7, 1.05, 1, 1.1] }}
            transition={{ duration: 2.2, times: [0, 0.2, 0.8, 1] }}
          >
            THE BULL CHARGES
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
