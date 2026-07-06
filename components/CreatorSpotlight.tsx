"use client";

import { motion } from "framer-motion";
import { ExternalLink, Heart, Sparkles, Wallet } from "lucide-react";
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

const BUILDERS = [
  {
    name: CREATOR_NAME,
    handle: CREATOR_HANDLE,
    role: "Chief Builder",
    emoji: "🐂",
    featured: true,
    desc: "Forged ANSEM Space — every pixel, every HP, every bull run.",
  },
  {
    name: "The Herd",
    handle: "@ANSEMcommunity",
    role: "Meme lords & diamond hands",
    emoji: "👑",
    featured: false,
    desc: "Every meme, vote, and arcade run builds this together.",
  },
  {
    name: "Top contributors",
    handle: "Live leaderboard",
    role: "Hall of fame",
    emoji: "🏆",
    featured: false,
    desc: "Climb the board. Top HP earners get builder credit on share cards.",
  },
];

export function CreatorSpotlight() {
  return (
    <section id="builders" className="section-shell section-glow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="gradient-border relative overflow-hidden rounded-3xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.06] via-transparent to-crimson/[0.04]" />
          <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[auto_1fr] lg:items-center">
            <div className="relative mx-auto lg:mx-0">
              <BullLogo glow className="h-24 w-24 sm:h-28 sm:w-28" />
              <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-gold/40 bg-crimson">
                <Heart size={14} className="fill-gold text-gold" />
              </span>
            </div>
            <div>
              <p className="font-mono text-xs text-gold">Built by the bull · for the herd</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-bone sm:text-4xl">
                {CREATOR_NAME}
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-ash">{CREATOR_STORY}</p>
              <p className="mt-4 font-medium text-gold">{CREATOR_TAGLINE}</p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <a
                  href={LINKS.creatorX}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-medium text-gold transition-all hover:bg-gold/20"
                >
                  𝕏 {CREATOR_HANDLE} <ExternalLink size={12} />
                </a>
                <span className="flex items-center gap-2 font-mono text-xs text-mist">
                  <Wallet size={12} className="text-gold" />
                  {shortAddress(CREATOR_WALLET, 6)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-14">
          <div className="mb-8 flex items-center gap-2">
            <Sparkles size={18} className="text-gold" />
            <h3 className="font-display text-xl font-bold text-bone">Hall of Builders</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {BUILDERS.map((b, i) => (
              <motion.div
                key={b.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className={
                  b.featured
                    ? "gradient-border rounded-2xl bg-gold/[0.04] p-6 shadow-gold-glow"
                    : "surface-card p-6"
                }
              >
                <span className="text-2xl">{b.emoji}</span>
                <p className="mt-4 font-display font-semibold text-bone">{b.name}</p>
                <p className="font-mono text-xs text-gold">{b.handle}</p>
                <p className="mt-1 text-xs text-mist">{b.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-ash">{b.desc}</p>
                {b.featured && (
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => window.open(LINKS.creatorX, "_blank")}>
                    Follow
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