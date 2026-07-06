"use client";

import { motion } from "framer-motion";
import { ArrowRight, Flame, Gamepad2, Sparkles, Target, TrendingUp } from "lucide-react";
import { BullLogo } from "@/components/BullLogo";
import { ContractAddress } from "@/components/ContractAddress";
import { Button } from "@/components/ui/button";
import { CREATOR_HANDLE, CREATOR_NAME, CREATOR_TAGLINE, LINKS, TAGLINE } from "@/lib/constants";

const TICKER = [
  "The Black Bull",
  "Diamond hands only",
  "Forge memes",
  "Charge forward",
  "Hold the line",
  "Community owned",
];

const FEATURES = [
  { icon: Flame, label: "Meme Forge", desc: "Create & share", href: "#forge", color: "text-gold" },
  { icon: Gamepad2, label: "Arcade", desc: "3 mini-games", href: "#charge", color: "text-crimson-bright" },
  { icon: Target, label: "Quests", desc: "Daily HP", href: "#quests", color: "text-bone" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

export function Hero() {
  return (
    <section id="top" className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden pt-20 pb-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[35%] h-[min(90vw,600px)] w-[min(90vw,600px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.1)_0%,transparent_68%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div variants={container} initial="hidden" animate="show">
            <motion.div variants={item} className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5">
              <span className="h-1.5 w-1.5 animate-pulseglow rounded-full bg-gold" />
              <span className="font-mono text-[11px] text-ash">Live on Solana · pump.fun</span>
            </motion.div>

            <motion.h1
              variants={item}
              className="font-display text-[2.5rem] font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.5rem]"
            >
              <span className="text-bone">Welcome to</span>
              <br />
              <span className="text-gold-shimmer">ANSEM Space</span>
            </motion.h1>

            <motion.p variants={item} className="mt-6 max-w-lg text-lg leading-relaxed text-ash">
              {TAGLINE} The hub for <span className="font-medium text-gold">$ANSEM</span> — memes, arcade,
              quests, and live market intel. Built by the herd, for the herd.
            </motion.p>

            <motion.div variants={item} className="mt-8 grid grid-cols-3 gap-3">
              {FEATURES.map((f) => (
                <a
                  key={f.href}
                  href={f.href}
                  className="surface-card-hover group p-4"
                >
                  <f.icon size={18} className={f.color} />
                  <p className="mt-3 font-display text-sm font-semibold text-bone">{f.label}</p>
                  <p className="mt-0.5 text-xs text-mist">{f.desc}</p>
                </a>
              ))}
            </motion.div>

            <motion.div variants={item} className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => document.getElementById("forge")?.scrollIntoView({ behavior: "smooth" })}>
                <Flame size={16} /> Enter the Forge
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => document.getElementById("charge")?.scrollIntoView({ behavior: "smooth" })}
              >
                <Gamepad2 size={16} /> Play Arcade
              </Button>
              <Button variant="ghost" size="lg" onClick={() => window.open(LINKS.pumpFun, "_blank")}>
                Buy $ANSEM <ArrowRight size={16} />
              </Button>
            </motion.div>

            <motion.div variants={item} className="mt-8">
              <ContractAddress full className="max-w-full" />
            </motion.div>

            <motion.a
              variants={item}
              href="#builders"
              className="mt-6 inline-flex items-center gap-2 text-sm text-ash transition-colors hover:text-gold"
            >
              <Sparkles size={14} />
              Built by {CREATOR_NAME} · {CREATOR_TAGLINE}
              <span className="font-mono text-xs text-mist">𝕏 {CREATOR_HANDLE}</span>
            </motion.a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-md lg:max-w-none"
          >
            <div className="absolute inset-0 rounded-full bg-gold/[0.06] blur-3xl" />
            <div className="relative animate-floaty">
              <BullLogo
                useSlot
                glow
                className="mx-auto h-64 w-64 drop-shadow-[0_0_80px_rgba(212,175,55,0.3)] sm:h-80 sm:w-80 lg:h-[22rem] lg:w-[22rem]"
              />
            </div>

            <div className="absolute -left-2 top-8 surface-card px-4 py-3 sm:left-0">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-gold" />
                <div>
                  <p className="font-mono text-[10px] text-mist">The Black Bull</p>
                  <p className="font-display text-sm font-semibold text-bone">$ANSEM</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-2 bottom-12 surface-card px-4 py-3 sm:right-0">
              <p className="font-mono text-[10px] text-mist">ansem.space</p>
              <p className="font-display text-sm font-semibold text-gold">Est. 2026</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 overflow-hidden border-t border-white/[0.05] bg-void/40 py-3 backdrop-blur-md">
        <div className="flex w-max animate-marquee gap-12 px-4">
          {[...TICKER, ...TICKER].map((w, i) => (
            <span key={i} className="flex items-center gap-12 font-mono text-xs text-mist">
              {w}
              <span className="text-gold/40">·</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}