"use client";

/**
 * SECTION 4 — LORE
 * Interactive timeline of the $ANSEM story. Items open modals with fake
 * embedded tweets + detail. "Story Mode" auto-advances chapter by chapter.
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, BookOpen, Heart, MessageCircle, Repeat2, Square } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useHerd } from "@/components/HerdProvider";
import { cn } from "@/lib/utils";

interface FakeTweet {
  author: string;
  handle: string;
  text: string;
  likes: string;
  reposts: string;
  replies: string;
}

interface LoreEvent {
  id: string;
  date: string;
  title: string;
  type: "launch" | "airdrop" | "tweet" | "pump" | "community";
  short: string;
  detail: string;
  tweet?: FakeTweet;
}

const TYPE_STYLE: Record<LoreEvent["type"], { icon: string; color: string; ring: string }> = {
  launch: { icon: "🚀", color: "text-gold", ring: "border-gold" },
  airdrop: { icon: "🪂", color: "text-gold", ring: "border-gold" },
  tweet: { icon: "𝕏", color: "text-bone", ring: "border-bone" },
  pump: { icon: "📈", color: "text-crimson", ring: "border-crimson" },
  community: { icon: "🐂", color: "text-gold", ring: "border-gold" },
};

const LORE_EVENTS: LoreEvent[] = [
  {
    id: "genesis",
    date: "Day 0",
    title: "The Bull is Born on pump.fun",
    type: "launch",
    short: "$ANSEM deploys on pump.fun. The Black Bull enters the arena.",
    detail:
      "It started like every legend does on Solana: a fresh pump.fun deploy and a handful of degens who felt something. Named in honor of Ansem (@blknoiz06) — the trader whose calls move timelines — $ANSEM bonded its curve and charged onto Raydium while most of CT was still asleep.",
  },
  {
    id: "first-notice",
    date: "Week 1",
    title: "The Timeline Notices",
    type: "tweet",
    short: "Screenshots circulate. The herd begins to form.",
    detail:
      "A handful of viral posts later, the chart did the thing charts do when a community decides it's real. Group chats lit up. The first bull emojis appeared in bios. The herd had found each other.",
    tweet: {
      author: "CT Degen",
      handle: "@solana_stampede",
      text: "not me watching the $ANSEM chart instead of sleeping 🐂 something is happening here. the black bull doesn't stop",
      likes: "4.2K",
      reposts: "891",
      replies: "312",
    },
  },
  {
    id: "airdrop-1",
    date: "The First Rain",
    title: "Ansem Airdrops the Herd",
    type: "airdrop",
    short: "Wallets touched by the legend himself. Grown degens wept.",
    detail:
      "The moment that turned holders into believers: airdrops attributed to Ansem's wallet landed across the community. It wasn't about the amount — it was about being seen. The 'still holding my airdrop' flex was born that day, and 83% of recipients (per herd legend) never sold a single token.",
    tweet: {
      author: "Ansem",
      handle: "@blknoiz06",
      text: "bull market is a mindset",
      likes: "28K",
      reposts: "3.4K",
      replies: "1.1K",
    },
  },
  {
    id: "great-pump",
    date: "The Vertical Day",
    title: "The Great Charge",
    type: "pump",
    short: "The candle CT still talks about. Paperhands were tested and found wanting.",
    detail:
      "One green candle so disrespectful it looked like a rendering error. Volume poured in, the chart went vertical, and everyone who'd sold 'the local top' the day before entered their villain arc. The survivors earned their diamond status permanently.",
  },
  {
    id: "dip-of-doubt",
    date: "The Test",
    title: "The Dip of Doubt",
    type: "community",
    short: "-60% wick. The herd's grip strength was forged here.",
    detail:
      "Every legend needs a trial. When the broader market wicked down, $ANSEM went with it — and the community's answer became the culture: HOLD THE LINE. Memes flowed faster than sell orders. The ones who held through this dip are the Hall of Fame's first inductees.",
    tweet: {
      author: "Herd Veteran",
      handle: "@line_holder",
      text: "sold nothing. bought more. the black bull eats dips for breakfast $ANSEM",
      likes: "2.8K",
      reposts: "540",
      replies: "97",
    },
  },
  {
    id: "space-founded",
    date: "Now",
    title: "ANSEM Space Goes Live",
    type: "community",
    short: "The herd gets a home: ansem.space. You are standing in it.",
    detail:
      "Memes needed a forge. The bull needed a game. The culture needed an archive. So the community built ansem.space — the central hub for everything $ANSEM. Forge memes, charge through paperhands, check your grip score, and write the next chapter of the lore yourself.",
  },
];

function FakeTweetCard({ tweet }: { tweet: FakeTweet }) {
  return (
    <div className="border border-edge bg-void p-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gold/40 to-crimson/40 font-display text-sm text-void">
          {tweet.author[0]}
        </div>
        <div>
          <p className="flex items-center gap-1 text-sm font-bold text-bone">
            {tweet.author} <BadgeCheck size={14} className="text-gold" />
          </p>
          <p className="font-mono text-xs text-ash">{tweet.handle}</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-bone">{tweet.text}</p>
      <div className="mt-3 flex gap-6 font-mono text-xs text-ash">
        <span className="flex items-center gap-1.5"><MessageCircle size={13} /> {tweet.replies}</span>
        <span className="flex items-center gap-1.5"><Repeat2 size={13} /> {tweet.reposts}</span>
        <span className="flex items-center gap-1.5 text-crimson"><Heart size={13} /> {tweet.likes}</span>
      </div>
      <p className="mt-3 border-t border-edge pt-2 font-mono text-[9px] uppercase tracking-widest text-ash/60">
        Dramatized community recreation — not a real embed
      </p>
    </div>
  );
}

export function Lore() {
  const { earn } = useHerd();
  const [openEvent, setOpenEvent] = useState<LoreEvent | null>(null);
  const [storyMode, setStoryMode] = useState(false);
  const [storyIndex, setStoryIndex] = useState(-1);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Story Mode: auto-scroll chapter to chapter; finishing the saga pays HP.
  useEffect(() => {
    if (!storyMode) return;
    if (storyIndex >= LORE_EVENTS.length) {
      setStoryMode(false);
      setStoryIndex(-1);
      earn("story"); // +100 HP first completion — Lore Keeper badge
      return;
    }
    if (storyIndex >= 0) {
      itemRefs.current[storyIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const t = setTimeout(() => setStoryIndex((i) => i + 1), storyIndex < 0 ? 200 : 3600);
    return () => clearTimeout(t);
  }, [storyMode, storyIndex, earn]);

  return (
    <section id="lore" className="section-shell">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          kicker="Archive"
          title="Lore"
          sub="From the pump.fun genesis block to the airdrops that made grown degens cry — the timeline of $ANSEM."
        />

        <div className="mb-10">
          {!storyMode ? (
            <Button onClick={() => { setStoryMode(true); setStoryIndex(0); }}>
              <BookOpen size={15} /> Story Mode — auto-play the saga
            </Button>
          ) : (
            <Button variant="crimson" onClick={() => { setStoryMode(false); setStoryIndex(-1); }}>
              <Square size={14} /> Stop Story Mode
            </Button>
          )}
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Spine */}
          <div className="absolute bottom-0 left-4 top-0 w-px bg-gradient-to-b from-gold/60 via-crimson/40 to-gold/20 sm:left-1/2" />

          <div className="space-y-10">
            {LORE_EVENTS.map((ev, i) => {
              const style = TYPE_STYLE[ev.type];
              const left = i % 2 === 0;
              const active = storyMode && storyIndex === i;
              return (
                <motion.div
                  key={ev.id}
                  ref={(el) => { itemRefs.current[i] = el; }}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55 }}
                  className={cn(
                    "relative grid gap-4 pl-12 sm:grid-cols-2 sm:pl-0",
                    left ? "" : ""
                  )}
                >
                  {/* Node */}
                  <div
                    className={cn(
                      "absolute left-4 top-2 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border-2 bg-void text-sm transition-all sm:left-1/2",
                      style.ring,
                      active && "scale-125 shadow-gold-glow"
                    )}
                  >
                    {style.icon}
                  </div>

                  {/* Card — alternates sides on desktop */}
                  <div className={cn("sm:px-10", left ? "sm:col-start-1 sm:text-right" : "sm:col-start-2")}>
                    <button
                      onClick={() => setOpenEvent(ev)}
                      className={cn(
                        "group w-full border bg-panel p-5 text-left shadow-panel transition-all hover:border-gold/50 hover:shadow-gold-glow",
                        active ? "border-gold shadow-gold-glow" : "border-edge",
                        left && "sm:text-right"
                      )}
                    >
                      <p className={cn("font-mono text-[10px] uppercase tracking-[0.25em]", style.color)}>
                        {ev.date}
                      </p>
                      <h3 className="mt-1.5 font-display text-base uppercase tracking-wide text-bone group-hover:text-gold sm:text-lg">
                        {ev.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-ash">{ev.short}</p>
                      <span className="mt-3 inline-block font-mono text-[10px] uppercase tracking-widest text-gold/70 group-hover:text-gold">
                        Open chapter →
                      </span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chapter modal */}
      <Dialog
        open={openEvent !== null}
        onClose={() => setOpenEvent(null)}
        title={openEvent ? `${TYPE_STYLE[openEvent.type].icon} ${openEvent.title}` : ""}
      >
        {openEvent && (
          <div className="space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-crimson">
              {openEvent.date}
            </p>
            <p className="text-sm leading-relaxed text-bone">{openEvent.detail}</p>
            {openEvent.tweet && <FakeTweetCard tweet={openEvent.tweet} />}
          </div>
        )}
      </Dialog>
    </section>
  );
}
