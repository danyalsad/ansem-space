"use client";

import { motion } from "framer-motion";
import { ArrowRight, Flame, Gamepad2 } from "lucide-react";
import { BullLogo } from "@/components/BullLogo";
import { ContractAddress } from "@/components/ContractAddress";
import { Button } from "@/components/ui/button";
import { LINKS, TAGLINE } from "@/lib/constants";

const TICKER_WORDS = [
  "THE BLACK BULL",
  "DIAMOND HANDS ONLY",
  "HOLD THE LINE",
  "FORGE MEMES",
  "CHARGE FORWARD",
  "PAPERHANDS GET TRAMPLED",
  "COMMUNITY OWNED",
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, y: 36 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export function Hero() {
  return (
    <section id="top" className="relative flex min-h-[100svh] items-center overflow-hidden pt-16">
      {/* Atmosphere: radial gold core, crimson under-glow, cyber grid, scanline */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[60vmax] w-[60vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.08)_0%,transparent_60%)]" />
        <div className="absolute bottom-0 left-1/2 h-[40vmax] w-[80vmax] -translate-x-1/2 translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(200,16,46,0.07)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.03)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="absolute inset-x-0 h-24 animate-scanline bg-gradient-to-b from-transparent via-gold/[0.04] to-transparent" />
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.div variants={item} className="mb-5 flex items-center gap-3">
            <span className="h-px w-10 bg-crimson" />
            <span className="font-mono text-xs uppercase tracking-[0.35em] text-crimson">
              The home of the herd · ansem.space
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            className="font-display text-4xl uppercase leading-[0.95] tracking-tight text-bone sm:text-6xl lg:text-7xl"
          >
            Welcome to
            <br />
            <span className="text-gold [text-shadow:0_0_40px_rgba(212,175,55,0.35)]">
              ANSEM Space
            </span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-6 max-w-xl font-display text-sm uppercase tracking-[0.2em] text-ash sm:text-base"
          >
            {TAGLINE.split(". ").map((part, i) => (
              <span key={part}>
                <span className={i === 1 ? "text-crimson" : i === 2 ? "text-gold" : "text-bone"}>
                  {part.replace(/\.$/, "")}.
                </span>{" "}
              </span>
            ))}
          </motion.p>

          <motion.p variants={item} className="mt-4 max-w-xl text-sm leading-relaxed text-ash">
            The central hub for the <span className="text-gold">$ANSEM</span> community — meme
            forge, endless-runner arcade, diamond-hands culture, full lore archive and live-feel
            intel. Built by the herd, for the herd.
          </motion.p>

          <motion.div variants={item} className="mt-8">
            <ContractAddress full className="max-w-full" />
          </motion.div>

          <motion.div variants={item} className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => document.getElementById("forge")?.scrollIntoView({ behavior: "smooth" })}>
              <Flame size={16} /> Enter the Forge
            </Button>
            <Button
              variant="crimson"
              size="lg"
              onClick={() => document.getElementById("charge")?.scrollIntoView({ behavior: "smooth" })}
            >
              <Gamepad2 size={16} /> Play Charge
            </Button>
            <Button variant="outline" size="lg" onClick={() => window.open(LINKS.pumpFun, "_blank")}>
              Buy $ANSEM <ArrowRight size={16} />
            </Button>
          </motion.div>
        </motion.div>

        {/* Giant floating bull */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto hidden lg:block"
        >
          <div className="absolute inset-0 scale-90 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.14)_0%,transparent_65%)] blur-xl" />
          <div className="animate-floaty">
            <BullLogo className="h-[26rem] w-[26rem] drop-shadow-[0_0_60px_rgba(212,175,55,0.3)]" />
          </div>
          {/* Orbiting accent ring */}
          <motion.div
            className="absolute inset-8 rounded-full border border-dashed border-gold/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </div>

      {/* Bottom marquee */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden border-t border-gold/15 bg-void/70 py-3 backdrop-blur">
        <div className="flex w-max animate-marquee gap-8">
          {[...TICKER_WORDS, ...TICKER_WORDS].map((w, i) => (
            <span
              key={i}
              className="flex items-center gap-8 font-display text-xs uppercase tracking-[0.3em] text-gold/60"
            >
              {w} <span className="text-crimson">◆</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
