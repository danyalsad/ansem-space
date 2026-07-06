"use client";

import { motion } from "framer-motion";
import { ExternalLink, Heart, Shield, Sparkles, Wallet } from "lucide-react";
import { BullLogo } from "@/components/BullLogo";
import { Button } from "@/components/ui/button";
import {
  CREATOR_HANDLE,
  CREATOR_NAME,
  CREATOR_STORY,
  CREATOR_TAGLINE,
  CREATOR_WALLET,
  LINKS,
} from "@/lib/constants";
import { shortAddress } from "@/lib/utils";

const BUILDER_SPOTLIGHTS = [
  {
    name: CREATOR_NAME,
    handle: CREATOR_HANDLE,
    role: "Chief Builder · The Architect",
    emoji: "🐂",
    highlight: true,
    desc: "Forged ANSEM Space from zero — every pixel, every HP, every bull run.",
  },
  {
    name: "The Herd",
    handle: "@ANSEMcommunity",
    role: "Meme Lords & Diamond Hands",
    emoji: "👑",
    highlight: false,
    desc: "Every meme posted, every vote cast, every Charge run — the herd builds this together.",
  },
  {
    name: "Top Contributors",
    handle: "Live leaderboard",
    role: "Hall of Fame",
    emoji: "🏆",
    highlight: false,
    desc: "Climb the global board. Top HP earners earn the Builder watermark on share cards.",
  },
];

export function CreatorSpotlight() {
  return (
    <section id="builders" className="relative scroll-mt-16 border-t border-gold/20 bg-gradient-to-b from-void via-abyss/80 to-void py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.06)_0%,transparent_55%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Hero credit banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden border border-gold/40 bg-panel shadow-gold-glow [clip-path:polygon(20px_0,100%_0,100%_calc(100%-20px),calc(100%-20px)_100%,0_100%,0_20px)]"
        >
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(212,175,55,0.08)_0%,transparent_50%,rgba(200,16,46,0.06)_100%)]" />
          <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            <div className="flex items-center gap-4">
              <div className="relative">
                <BullLogo glow className="h-20 w-20 sm:h-24 sm:w-24" />
                <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-gold bg-crimson text-xs">
                  <Heart size={12} className="fill-gold text-gold" />
                </span>
              </div>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-crimson">
                Built by the bull · for the herd
              </p>
              <h2 className="mt-2 font-display text-2xl uppercase tracking-tight text-bone sm:text-4xl">
                {CREATOR_NAME}
                <span className="text-gold"> — Chief Builder</span>
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ash">{CREATOR_STORY}</p>
              <p className="mt-4 font-display text-xs uppercase tracking-[0.25em] text-gold">
                {CREATOR_TAGLINE}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <a
                  href={LINKS.creatorX}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-gold/50 bg-gold/10 px-4 py-2.5 font-display text-xs uppercase tracking-wider text-gold transition-all hover:border-gold hover:shadow-gold-glow"
                >
                  𝕏 {CREATOR_HANDLE} <ExternalLink size={12} />
                </a>
                <span className="flex items-center gap-2 font-mono text-[10px] text-ash">
                  <Wallet size={11} className="text-gold" />
                  {shortAddress(CREATOR_WALLET, 6)}
                </span>
              </div>
            </div>

            <div className="hidden flex-col items-end gap-2 lg:flex">
              <Shield size={32} className="text-gold/60" />
              <span className="font-mono text-[9px] uppercase tracking-widest text-ash">
                Verified builder
              </span>
            </div>
          </div>
        </motion.div>

        {/* Hall of Builders */}
        <div className="mt-12">
          <div className="mb-6 flex items-center gap-3">
            <Sparkles size={18} className="text-gold" />
            <h3 className="font-display text-lg uppercase tracking-widest text-gold">
              Hall of Builders
            </h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {BUILDER_SPOTLIGHTS.map((b, i) => (
              <motion.div
                key={b.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={
                  b.highlight
                    ? "border border-gold/50 bg-gold/5 p-5 shadow-gold-glow"
                    : "border border-edge bg-panel p-5"
                }
              >
                <span className="text-2xl">{b.emoji}</span>
                <p className="mt-3 font-display text-sm uppercase tracking-wide text-bone">{b.name}</p>
                <p className="font-mono text-[10px] text-gold">{b.handle}</p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-crimson">{b.role}</p>
                <p className="mt-3 text-xs leading-relaxed text-ash">{b.desc}</p>
                {b.highlight && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => window.open(LINKS.creatorX, "_blank")}
                  >
                    Follow the builder
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}