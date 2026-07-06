"use client";

import { motion } from "framer-motion";
import { ArrowRight, Flame, Gamepad2, Target, Zap } from "lucide-react";
import { BullLogo } from "@/components/BullLogo";
import { ContractAddress } from "@/components/ContractAddress";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/Panel";
import { CREATOR_HANDLE, CREATOR_NAME, CREATOR_TAGLINE, LINKS, TAGLINE } from "@/lib/constants";

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
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};
const item = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] } },
};

const QUICK_STATS = [
  { icon: Flame, label: "Meme Forge", href: "#forge" },
  { icon: Zap, label: "Charge Game", href: "#charge" },
  { icon: Target, label: "Daily Quests", href: "#quests" },
];

export function Hero() {
  return (
    <section id="top" className="relative flex min-h-[100svh] items-center overflow-hidden pt-16">
      {/* Local hero atmosphere */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[28%] h-[70vmax] w-[70vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.12)_0%,transparent_58%)]" />
        <div className="absolute -right-20 top-1/4 h-[50vmax] w-[50vmax] rounded-full bg-[radial-gradient(circle,rgba(200,16,46,0.1)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-grid opacity-50" />
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:py-20">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.div variants={item} className="mb-6 inline-flex items-center gap-3 border border-gold/25 bg-gold/5 px-4 py-2 horn-clip-sm">
            <span className="h-2 w-2 animate-pulseglow rounded-full bg-crimson-bright" />
            <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-gold">
              The home of the herd
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            className="font-display text-[2.75rem] uppercase leading-[0.9] tracking-tight text-bone sm:text-6xl lg:text-[5.25rem]"
          >
            Welcome to
            <br />
            <span className="text-gold-shimmer">ANSEM Space</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-6 max-w-xl font-display text-sm uppercase tracking-[0.18em] text-ash sm:text-base"
          >
            {TAGLINE.split(". ").map((part, i) => (
              <span key={part}>
                <span className={i === 1 ? "text-crimson-bright" : i === 2 ? "text-gold" : "text-bone"}>
                  {part.replace(/\.$/, "")}.
                </span>{" "}
              </span>
            ))}
          </motion.p>

          <motion.p variants={item} className="mt-4 max-w-xl text-sm leading-relaxed text-ash/90">
            The central hub for <span className="text-gold font-medium">$ANSEM</span> — meme forge,
            endless-runner arcade, daily quests, diamond-hands culture, lore archive and live intel.
          </motion.p>

          {/* Quick-nav pills */}
          <motion.div variants={item} className="mt-6 flex flex-wrap gap-2">
            {QUICK_STATS.map((s) => (
              <a
                key={s.href}
                href={s.href}
                className="group flex items-center gap-2 border border-edge bg-panel/80 px-3.5 py-2 font-mono text-[10px] uppercase tracking-wider text-ash transition-all hover:border-gold/50 hover:text-gold horn-clip-sm"
              >
                <s.icon size={12} className="text-gold/70 group-hover:text-gold" />
                {s.label}
              </a>
            ))}
          </motion.div>

          <motion.a
            variants={item}
            href="#builders"
            className="mt-6 block max-w-xl"
          >
            <Panel variant="gold" glow className="p-4 transition-all hover:shadow-panel-lift">
              <p className="font-display text-[10px] uppercase tracking-[0.28em] text-crimson-bright">
                Built by {CREATOR_NAME}
              </p>
              <p className="mt-1 font-mono text-sm text-gold">{CREATOR_TAGLINE}</p>
              <p className="mt-1 font-mono text-[10px] text-ash">𝕏 {CREATOR_HANDLE} · Hall of Builders →</p>
            </Panel>
          </motion.a>

          <motion.div variants={item} className="mt-7">
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

        {/* Hero bull — high-res slot asset */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1.1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto hidden w-full max-w-lg lg:block"
        >
          <div className="absolute inset-0 animate-pulse-ring rounded-full bg-gold/10 blur-3xl" />
          <div className="absolute inset-4 rounded-full border border-dashed border-gold/20" />
          <motion.div
            className="absolute inset-6 rounded-full border border-gold/10"
            animate={{ rotate: 360 }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          />
          <div className="relative animate-floaty px-8 py-4">
            <BullLogo
              useSlot
              glow
              className="mx-auto h-[22rem] w-[22rem] drop-shadow-[0_0_80px_rgba(212,175,55,0.35)] sm:h-[26rem] sm:w-[26rem]"
            />
          </div>
          {/* Accent stats floating card */}
          <Panel variant="glass" className="absolute -bottom-2 -left-4 px-4 py-3 sm:-left-8">
            <p className="font-mono text-[9px] uppercase tracking-widest text-ash">Live on</p>
            <p className="font-display text-sm text-gold">ansem.space</p>
          </Panel>
          <Panel variant="glass" className="absolute -right-2 top-8 px-4 py-3 sm:-right-6">
            <p className="font-mono text-[9px] uppercase tracking-widest text-crimson-bright">The Black Bull</p>
            <p className="font-display text-sm text-bone">$ANSEM</p>
          </Panel>
        </motion.div>
      </div>

      {/* Marquee */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden border-t border-gold/20 nav-glass py-3.5">
        <div className="flex w-max animate-marquee gap-10">
          {[...TICKER_WORDS, ...TICKER_WORDS].map((w, i) => (
            <span
              key={i}
              className="flex items-center gap-10 font-display text-[11px] uppercase tracking-[0.35em] text-gold/50"
            >
              {w} <span className="text-crimson">◆</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}