"use client";

/**
 * SECTION 5 — INTEL (Dashboard)
 * Real on-chain + market tools:
 *  - Whale feed: live $ANSEM transactions via /api/whales (Helius)
 *  - Sentiment: real 24h buy/sell pressure via DexScreener
 *  - Bubblemap: live top-holder distribution via /api/holders (Helius)
 *  - Airdrop predictor: honest local community poll (+20 HP)
 * Each panel falls back gracefully (and says so) if a data source is down.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Radar, Waves } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { useHerd } from "@/components/HerdProvider";
import { useMarket } from "@/components/MarketProvider";
import { LS } from "@/lib/constants";
import { fireConfetti } from "@/lib/confetti";
import { cn, formatCompact, formatUsd, seededRandom, store } from "@/lib/utils";

type Source = "helius" | "simulated" | "loading";

function SourceBadge({ source }: { source: Source }) {
  return (
    <span
      className={cn(
        "ml-auto flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest",
        source === "helius" ? "text-gold" : "text-ash/60"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          source === "helius" ? "animate-pulseglow bg-gold" : "bg-ash/40"
        )}
      />
      {source === "helius" ? "Live · Helius" : source === "loading" ? "Connecting…" : "Offline demo"}
    </span>
  );
}

/* ---------------- whale feed (live) ---------------- */

interface WhaleTx {
  id: string;
  wallet: string;
  action: "BUY" | "SELL" | "TRANSFER";
  amount: number;
  ts: string;
}

const POLL_MS = 25_000;

function WhaleFeed() {
  const [txs, setTxs] = useState<WhaleTx[]>([]);
  const [source, setSource] = useState<Source>("loading");

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const fmt = (unix?: number) =>
      new Date(unix ? unix * 1000 : Date.now()).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

    async function load() {
      try {
        const res = await fetch("/api/whales");
        const json: {
          source: string;
          txs: Array<{ id: string; wallet: string; action: WhaleTx["action"]; amount: number; time?: number }>;
        } = await res.json();
        if (cancelled) return;
        setSource(json.source === "helius" ? "helius" : "simulated");
        setTxs(
          json.txs.slice(0, 8).map((t) => ({
            id: t.id,
            wallet: t.wallet,
            action: t.action,
            amount: t.amount,
            ts: fmt(t.time),
          }))
        );
      } catch {
        if (!cancelled) setSource((s) => (s === "loading" ? "simulated" : s));
      }
      if (!cancelled) timer = setTimeout(load, POLL_MS);
    }

    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="border border-edge bg-panel p-5 shadow-panel [clip-path:polygon(12px_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%,0_12px)]">
      <h3 className="flex items-center gap-2 font-display text-sm uppercase tracking-widest text-gold">
        <Waves size={16} /> Whale Movements
        <SourceBadge source={source} />
      </h3>
      <p className="mt-1 font-mono text-[10px] text-ash">
        Recent $ANSEM transactions on Solana · refreshes every {POLL_MS / 1000}s
      </p>
      <div className="mt-4 space-y-1.5 overflow-hidden">
        {txs.length === 0 && (
          <p className="py-6 text-center font-mono text-xs text-ash">Scanning the chain…</p>
        )}
        <AnimatePresence initial={false}>
          {txs.map((tx) => (
            <motion.div
              key={tx.id}
              layout
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="flex items-center justify-between gap-2 border-b border-edge/40 py-2 font-mono text-xs"
            >
              <span className="truncate text-bone">{tx.wallet}</span>
              <span
                className={cn(
                  "shrink-0 px-1.5 py-0.5 text-[10px] font-bold",
                  tx.action === "BUY" && "bg-gold/15 text-gold",
                  tx.action === "SELL" && "bg-crimson/15 text-crimson-bright",
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

/* ---------------- sentiment gauge (real buy/sell pressure) ---------------- */

function SentimentGauge() {
  const market = useMarket();
  const totalTx = market.buys24h + market.sells24h;
  // Buy share of the last 24h of real transactions.
  const value = totalTx > 0 ? (market.buys24h / totalTx) * 100 : 50;

  const angle = -90 + (value / 100) * 180;
  const label = !market.live
    ? "CONNECTING…"
    : value > 62
      ? "MAXIMUM BULL"
      : value > 52
        ? "BULLISH"
        : value > 45
          ? "CONTESTED"
          : "BEARS TESTING";

  return (
    <div className="border border-edge bg-panel p-5 shadow-panel [clip-path:polygon(12px_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%,0_12px)]">
      <h3 className="flex items-center gap-2 font-display text-sm uppercase tracking-widest text-gold">
        <Activity size={16} /> Buy Pressure
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-gold">
          <span className={cn("h-1.5 w-1.5 rounded-full", market.live ? "animate-pulseglow bg-gold" : "bg-ash/40")} />
          {market.live ? "Live · DexScreener" : "Connecting…"}
        </span>
      </h3>
      <p className="mt-1 font-mono text-[10px] text-ash">
        Real buys vs sells over the last 24h
      </p>
      <div className="mx-auto mt-4 w-full max-w-[240px]">
        <svg viewBox="0 0 200 118" className="w-full">
          <path d="M 16 104 A 84 84 0 0 1 60 30" fill="none" stroke="#C8102E" strokeWidth="13" strokeLinecap="round" opacity="0.75" />
          <path d="M 66 26 A 84 84 0 0 1 134 26" fill="none" stroke="#8C7326" strokeWidth="13" strokeLinecap="round" opacity="0.85" />
          <path d="M 140 30 A 84 84 0 0 1 184 104" fill="none" stroke="#D4AF37" strokeWidth="13" strokeLinecap="round" />
          <g transform={`rotate(${angle} 100 104)`} style={{ transition: "transform 1.2s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <line x1="100" y1="104" x2="100" y2="34" stroke="#F2EFE9" strokeWidth="3.5" strokeLinecap="round" />
          </g>
          <circle cx="100" cy="104" r="7" fill="#D4AF37" />
        </svg>
        <p className="text-center font-display text-xl uppercase tracking-widest text-gold">{label}</p>
        <p className="text-center font-mono text-xs text-ash">
          {market.live ? `${value.toFixed(0)}% of 24h txns are buys` : "fetching market data"}
        </p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-edge pt-4 text-center sm:grid-cols-4">
        <div>
          <p className="font-mono text-sm text-gold">{market.buys24h.toLocaleString()}</p>
          <p className="font-mono text-[9px] uppercase tracking-wider text-ash">Buys 24h</p>
        </div>
        <div>
          <p className="font-mono text-sm text-crimson-bright">{market.sells24h.toLocaleString()}</p>
          <p className="font-mono text-[9px] uppercase tracking-wider text-ash">Sells 24h</p>
        </div>
        <div>
          <p className="font-mono text-sm text-bone">{formatUsd(market.volume24h, 0)}</p>
          <p className="font-mono text-[9px] uppercase tracking-wider text-ash">Volume 24h</p>
        </div>
        <div>
          <p className="font-mono text-sm text-bone">{formatUsd(market.liquidity, 0)}</p>
          <p className="font-mono text-[9px] uppercase tracking-wider text-ash">Liquidity</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- holder bubblemap (live) ---------------- */

interface Bubble {
  x: number;
  y: number;
  r: number;
  label: string;
  pct: string;
}

interface HolderDto {
  label: string;
  pct: number;
}

/** Rejection-sample non-overlapping positions for the holder bubbles. */
function layoutBubbles(holders: HolderDto[]): Bubble[] {
  const rand = seededRandom(42);
  const maxPct = Math.max(...holders.map((h) => h.pct), 1);
  const bubbles: Bubble[] = [];
  for (const h of holders) {
    // Radius scales with share of the largest holder.
    const r = 3 + (h.pct / maxPct) * 12;
    let x = 0,
      y = 0,
      ok = false,
      tries = 0;
    while (!ok && tries < 80) {
      x = 10 + rand() * 80;
      y = 12 + rand() * 72;
      ok = bubbles.every((b) => Math.hypot(b.x - x, b.y - y) > b.r + r + 1.5);
      tries++;
    }
    bubbles.push({ x, y, r, label: h.label, pct: `${h.pct.toFixed(2)}%` });
  }
  return bubbles;
}

function BubbleMap() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [source, setSource] = useState<Source>("loading");
  const [hovered, setHovered] = useState<Bubble | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/holders")
      .then((r) => r.json())
      .then((json: { source: string; holders: HolderDto[] }) => {
        if (cancelled) return;
        setSource(json.source === "helius" ? "helius" : "simulated");
        setBubbles(layoutBubbles(json.holders));
      })
      .catch(() => {
        if (!cancelled) setSource("simulated");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="border border-edge bg-panel p-5 shadow-panel [clip-path:polygon(12px_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%,0_12px)]">
      <h3 className="flex items-center gap-2 font-display text-sm uppercase tracking-widest text-gold">
        <Radar size={16} /> Top Holders
        <SourceBadge source={source} />
      </h3>
      <p className="mt-1 font-mono text-[10px] text-ash">
        {hovered
          ? `${hovered.label} holds ${hovered.pct} of supply`
          : "Largest 20 wallets by share of supply · hover a bubble"}
      </p>
      {bubbles.length === 0 ? (
        <p className="py-14 text-center font-mono text-xs text-ash">Mapping holders…</p>
      ) : (
        <svg viewBox="0 0 100 92" className="mt-3 w-full">
          {bubbles.map((b, i) => (
            <motion.circle
              key={`${b.label}-${i}`}
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
              fill={i === 0 ? "rgba(212,175,55,0.8)" : "rgba(242,239,233,0.14)"}
              stroke={i === 0 ? "#D4AF37" : hovered === b ? "#D4AF37" : "rgba(212,175,55,0.25)"}
              strokeWidth="0.5"
            >
              <title>{`${b.label} · ${b.pct}`}</title>
            </motion.circle>
          ))}
        </svg>
      )}
    </div>
  );
}

/* ---------------- airdrop predictor (honest local poll) ---------------- */

const PREDICTION_OPTIONS = [
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "moon", label: "On a full moon 🌕" },
  { id: "cooking", label: "Never — he's cooking something bigger" },
];

function AirdropPredictor() {
  const { earn } = useHerd();
  const [choice, setChoice] = useState<string | null>(null);

  useEffect(() => {
    setChoice(store.get<string | null>(LS.prediction, null));
  }, []);

  function vote(id: string) {
    if (choice) return;
    setChoice(id);
    store.set(LS.prediction, id);
    earn("intel"); // +20 HP — unlocks the Oracle badge
    fireConfetti({ count: 60 });
  }

  return (
    <div className="border border-gold/30 bg-panel p-5 shadow-panel [clip-path:polygon(12px_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%,0_12px)]">
      <h3 className="font-display text-sm uppercase tracking-widest text-gold">
        🪂 Next Airdrop Predictor
      </h3>
      <p className="mt-1 font-mono text-[10px] text-ash">
        When does the legend rain on the herd again? Cast your prophecy — worth +20 HP.
      </p>
      <div className="mt-4 space-y-2.5">
        {PREDICTION_OPTIONS.map((o) => {
          const mine = choice === o.id;
          return (
            <button
              key={o.id}
              onClick={() => vote(o.id)}
              disabled={!!choice}
              className={cn(
                "relative w-full overflow-hidden border px-4 py-3 text-left transition-all",
                mine ? "border-gold bg-gold/10" : "border-edge",
                !choice && "hover:border-gold/60"
              )}
            >
              <span className="relative flex items-center justify-between gap-2 text-sm">
                <span className={mine ? "text-gold" : "text-bone"}>
                  {o.label} {mine && "✓"}
                </span>
                {mine && <span className="font-mono text-xs text-gold">your prophecy</span>}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 font-mono text-[10px] text-ash">
        {choice
          ? "Prophecy recorded on this device. The herd remembers."
          : "One vote per bull. Stored locally."}
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
          sub="The war room, running on real data: live whale movements and holder distribution from the Solana chain, and genuine 24h buy/sell pressure from DexScreener."
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
