"use client";

/**
 * SECTION 5 — INTEL (Dashboard)
 * Live-feel (simulated) on-chain + social tools: whale movement feed with
 * Ansem's wallet highlighted, a social sentiment gauge, a bubblemaps-style
 * holder visualization, and the Next Airdrop Predictor with local voting.
 */

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Radar, Waves } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { useWallet } from "@/components/WalletProvider";
import { LS } from "@/lib/constants";
import { fireConfetti } from "@/lib/confetti";
import { cn, fakeSolAddress, formatCompact, seededRandom, shortAddress, store } from "@/lib/utils";

/* ---------------- whale feed ---------------- */

interface WhaleTx {
  id: number;
  wallet: string;
  isAnsem: boolean;
  action: "BUY" | "SELL" | "TRANSFER";
  amount: number;
  ts: string;
}

const WHALE_NAMES = ["orca.sol", "moby_degen", "deepwater", "leviathan", "krakenfeed", "bigfin"];

function makeTx(id: number): WhaleTx {
  const isAnsem = Math.random() < 0.18;
  const r = Math.random();
  return {
    id,
    wallet: isAnsem ? "Ansem 🐂" : Math.random() < 0.5 ? WHALE_NAMES[Math.floor(Math.random() * WHALE_NAMES.length)] : shortAddress(fakeSolAddress()),
    isAnsem,
    // Ansem never sells in our simulation. Obviously.
    action: isAnsem ? (r < 0.6 ? "BUY" : "TRANSFER") : r < 0.45 ? "BUY" : r < 0.75 ? "SELL" : "TRANSFER",
    amount: Math.floor(Math.random() * 4_800_000) + 150_000,
    ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
}

function WhaleFeed() {
  const [txs, setTxs] = useState<WhaleTx[]>([]);

  useEffect(() => {
    let id = 0;
    // Seed a few immediately so the panel never looks empty.
    setTxs([makeTx(id++), makeTx(id++), makeTx(id++)]);
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setTxs((prev) => [makeTx(id++), ...prev].slice(0, 7));
      timer = setTimeout(tick, 1800 + Math.random() * 2600);
    };
    timer = setTimeout(tick, 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="border border-edge bg-panel p-5 shadow-panel [clip-path:polygon(12px_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%,0_12px)]">
      <h3 className="flex items-center gap-2 font-display text-sm uppercase tracking-widest text-gold">
        <Waves size={16} /> Whale Movements
      </h3>
      <p className="mt-1 font-mono text-[10px] text-ash">Simulated feed · Ansem's wallet highlighted</p>
      <div className="mt-4 space-y-1.5 overflow-hidden">
        <AnimatePresence initial={false}>
          {txs.map((tx) => (
            <motion.div
              key={tx.id}
              layout
              initial={{ opacity: 0, x: -24, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className={cn(
                "flex items-center justify-between gap-2 border-b border-edge/40 py-2 font-mono text-xs",
                tx.isAnsem && "bg-gold/10 px-2 text-gold"
              )}
            >
              <span className={cn("truncate", tx.isAnsem ? "font-bold text-gold" : "text-bone")}>
                {tx.wallet}
              </span>
              <span
                className={cn(
                  "shrink-0 px-1.5 py-0.5 text-[10px] font-bold",
                  tx.action === "BUY" && "bg-gold/15 text-gold",
                  tx.action === "SELL" && "bg-crimson/15 text-crimson",
                  tx.action === "TRANSFER" && "bg-bone/10 text-ash"
                )}
              >
                {tx.action}
              </span>
              <span className="shrink-0 tabular-nums text-ash">{formatCompact(tx.amount)}</span>
              <span className="hidden shrink-0 text-[10px] text-ash/60 sm:inline">{tx.ts}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---------------- sentiment gauge ---------------- */

const FAKE_POSTS = [
  { handle: "@bullish_bertha", text: "$ANSEM chart looking like my heart rate when Ansem tweets", mood: "🔥" },
  { handle: "@sol_scout", text: "the $ANSEM community might be the most unhinged (affectionate) on CT", mood: "🐂" },
  { handle: "@chartgoblin", text: "took profit on everything except $ANSEM. some things you just hold", mood: "💎" },
  { handle: "@fudpatrol", text: "tried to fud $ANSEM, got memed into oblivion, buying back in", mood: "😅" },
];

function SentimentGauge() {
  const [value, setValue] = useState(78);

  useEffect(() => {
    const id = setInterval(() => {
      setValue((v) => Math.min(97, Math.max(55, v + (Math.random() * 10 - 4.4))));
    }, 3200);
    return () => clearInterval(id);
  }, []);

  // Map 0-100 to a 180° arc needle
  const angle = -90 + (value / 100) * 180;
  const label = value > 85 ? "MAXIMUM BULL" : value > 70 ? "BULLISH" : value > 55 ? "WARMING UP" : "COPING";

  return (
    <div className="border border-edge bg-panel p-5 shadow-panel [clip-path:polygon(12px_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%,0_12px)]">
      <h3 className="flex items-center gap-2 font-display text-sm uppercase tracking-widest text-gold">
        <Activity size={16} /> Social Sentiment
      </h3>
      <div className="mx-auto mt-4 w-full max-w-[240px]">
        <svg viewBox="0 0 200 118" className="w-full">
          {/* Arc segments: cope → bull */}
          <path d="M 16 104 A 84 84 0 0 1 60 30" fill="none" stroke="#FF2E2E" strokeWidth="13" strokeLinecap="round" opacity="0.75" />
          <path d="M 66 26 A 84 84 0 0 1 134 26" fill="none" stroke="#B8960B" strokeWidth="13" strokeLinecap="round" opacity="0.85" />
          <path d="M 140 30 A 84 84 0 0 1 184 104" fill="none" stroke="#FFD700" strokeWidth="13" strokeLinecap="round" />
          {/* Needle */}
          <g transform={`rotate(${angle} 100 104)`} style={{ transition: "transform 1.2s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <line x1="100" y1="104" x2="100" y2="34" stroke="#EDE8DC" strokeWidth="3.5" strokeLinecap="round" />
          </g>
          <circle cx="100" cy="104" r="7" fill="#FFD700" />
        </svg>
        <p className="text-center font-display text-xl uppercase tracking-widest text-gold">{label}</p>
        <p className="text-center font-mono text-xs text-ash">{value.toFixed(0)} / 100 herd energy</p>
      </div>
      <div className="mt-4 space-y-2 border-t border-edge pt-4">
        {FAKE_POSTS.map((p) => (
          <div key={p.handle} className="flex gap-2 text-xs">
            <span>{p.mood}</span>
            <p className="text-ash">
              <span className="font-mono text-bone">{p.handle}</span> {p.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- holder bubblemap ---------------- */

interface Bubble {
  x: number;
  y: number;
  r: number;
  label: string;
  pct: string;
  isAnsem: boolean;
}

function buildBubbles(): Bubble[] {
  const rand = seededRandom(42);
  const bubbles: Bubble[] = [
    { x: 50, y: 46, r: 15, label: "Ansem 🐂", pct: "6.9%", isAnsem: true },
  ];
  const names = ["LP Pool", "orca.sol", "herd_og", "moby", "grandma_sol", "bullmonk", "deepwater", "hoofdaddy"];
  for (let i = 0; i < 22; i++) {
    // Rejection-sample positions so bubbles roughly avoid each other.
    let x = 0, y = 0, r = 0, ok = false, tries = 0;
    while (!ok && tries < 40) {
      r = 2.5 + rand() * 8;
      x = 8 + rand() * 84;
      y = 10 + rand() * 78;
      ok = bubbles.every((b) => Math.hypot(b.x - x, b.y - y) > b.r + r + 1.5);
      tries++;
    }
    bubbles.push({
      x, y, r,
      label: i < names.length ? names[i] : shortAddress(fakeSolAddress(rand)),
      pct: `${(r / 6).toFixed(1)}%`,
      isAnsem: false,
    });
  }
  return bubbles;
}

function BubbleMap() {
  const bubbles = useMemo(buildBubbles, []);
  const [hovered, setHovered] = useState<Bubble | null>(null);

  return (
    <div className="border border-edge bg-panel p-5 shadow-panel [clip-path:polygon(12px_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%,0_12px)]">
      <h3 className="flex items-center gap-2 font-display text-sm uppercase tracking-widest text-gold">
        <Radar size={16} /> Holder Bubblemap
      </h3>
      <p className="mt-1 font-mono text-[10px] text-ash">
        {hovered ? `${hovered.label} · ${hovered.pct} of supply` : "Hover a bubble · simulated distribution"}
      </p>
      <svg viewBox="0 0 100 92" className="mt-3 w-full">
        {bubbles.map((b, i) => (
          <motion.circle
            key={i}
            cx={b.x}
            cy={b.y}
            r={b.r}
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.03, type: "spring", stiffness: 200, damping: 16 }}
            onMouseEnter={() => setHovered(b)}
            onMouseLeave={() => setHovered(null)}
            className="cursor-pointer"
            fill={b.isAnsem ? "rgba(255,215,0,0.85)" : "rgba(237,232,220,0.14)"}
            stroke={b.isAnsem ? "#FFD700" : hovered === b ? "#FFD700" : "rgba(255,215,0,0.25)"}
            strokeWidth="0.5"
          />
        ))}
        {/* Label the Ansem bubble directly */}
        <text x="50" y="47.5" textAnchor="middle" fontSize="4" fill="#0A0A0A" fontWeight="900">
          ANSEM
        </text>
      </svg>
    </div>
  );
}

/* ---------------- airdrop predictor ---------------- */

const PREDICTION_OPTIONS = [
  { id: "week", label: "This week", base: 342 },
  { id: "month", label: "This month", base: 511 },
  { id: "moon", label: "On a full moon 🌕", base: 189 },
  { id: "cooking", label: "Never — he's cooking something bigger", base: 267 },
];

function AirdropPredictor() {
  const { address } = useWallet();
  const [choice, setChoice] = useState<string | null>(null);

  useEffect(() => {
    setChoice(store.get<string | null>(LS.prediction, null));
  }, []);

  function vote(id: string) {
    if (choice) return;
    setChoice(id);
    store.set(LS.prediction, id);
    fireConfetti({ count: 60 });
  }

  const total = PREDICTION_OPTIONS.reduce((a, o) => a + o.base, 0) + (choice ? 1 : 0);

  return (
    <div className="border border-gold/30 bg-panel p-5 shadow-panel [clip-path:polygon(12px_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%,0_12px)]">
      <h3 className="font-display text-sm uppercase tracking-widest text-gold">
        🪂 Next Airdrop Predictor
      </h3>
      <p className="mt-1 font-mono text-[10px] text-ash">
        When does the legend rain on the herd again? Cast your prophecy.
      </p>
      <div className="mt-4 space-y-2.5">
        {PREDICTION_OPTIONS.map((o) => {
          const votes = o.base + (choice === o.id ? 1 : 0);
          const pct = Math.round((votes / total) * 100);
          const mine = choice === o.id;
          return (
            <button
              key={o.id}
              onClick={() => vote(o.id)}
              disabled={!!choice}
              className={cn(
                "relative w-full overflow-hidden border px-4 py-3 text-left transition-all",
                mine ? "border-gold" : "border-edge",
                !choice && "hover:border-gold/60"
              )}
            >
              {choice && (
                <motion.span
                  className={cn("absolute inset-y-0 left-0", mine ? "bg-gold/20" : "bg-bone/5")}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              )}
              <span className="relative flex items-center justify-between gap-2 text-sm">
                <span className={mine ? "text-gold" : "text-bone"}>
                  {o.label} {mine && "✓"}
                </span>
                {choice && <span className="font-mono text-xs text-ash">{pct}% · {votes}</span>}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 font-mono text-[10px] text-ash">
        {choice
          ? "Prophecy recorded. The herd remembers."
          : address
            ? "One vote per bull."
            : "Tip: connect your wallet first for maximum prophecy energy."}
      </p>
    </div>
  );
}

/* ---------------- section ---------------- */

export function Intel() {
  return (
    <section id="intel" className="relative scroll-mt-16 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          kicker="Section 05 — Dashboard"
          title="Intel"
          sub="The war room. Watch the whales move, read the herd's mood, map the holders, and prophesy the next airdrop. All signals simulated for entertainment — feels live, hits different."
        />
        <div className="grid gap-6 md:grid-cols-2">
          <WhaleFeed />
          <SentimentGauge />
          <BubbleMap />
          <AirdropPredictor />
        </div>
      </div>
    </section>
  );
}
