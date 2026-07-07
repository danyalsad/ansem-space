"use client";

/**
 * PLAYGROUND — 6 arcade games + daily activities hub.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Gamepad2,
  Gem,
  Layers,
  Shield,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { DailyActivities } from "@/components/activities/DailyActivities";
import { ChargeRunner } from "@/components/games/ChargeRunner";
import { BullTap } from "@/components/games/BullTap";
import { HoldTheLine } from "@/components/games/HoldTheLine";
import { PumpOrDump } from "@/components/games/PumpOrDump";
import { RugDodge } from "@/components/games/RugDodge";
import { BullMatch } from "@/components/games/BullMatch";
import { loadHighs, loadLeaderboard, GAME_LABELS, type ArcadeGame, type ArcadeScore } from "@/lib/games";
import { useWallet } from "@/components/WalletProvider";
import { cn, shortAddress } from "@/lib/utils";

const GAMES: { id: ArcadeGame; label: string; icon: typeof Gamepad2; desc: string; tag?: string }[] = [
  { id: "charge", label: "Charge", icon: Gamepad2, desc: "Endless runner", tag: "Popular" },
  { id: "tap", label: "Bull Tap", icon: Zap, desc: "30s reflex" },
  { id: "hold", label: "Hold the Line", icon: Gem, desc: "Diamond hands" },
  { id: "pump", label: "Pump or Dump", icon: TrendingUp, desc: "12-round calls", tag: "New" },
  { id: "rug", label: "Rug Dodge", icon: Shield, desc: "Dodge paper hands", tag: "New" },
  { id: "match", label: "Bull Match", icon: Brain, desc: "Memory pairs", tag: "New" },
];

function GameView({
  tab,
  board,
  onLeaderboard,
  onEnd,
}: {
  tab: ArcadeGame;
  board: ArcadeScore[];
  onLeaderboard: (rows: ArcadeScore[]) => void;
  onEnd: () => void;
}) {
  switch (tab) {
    case "charge":
      return <ChargeRunner leaderboard={board} onLeaderboard={onLeaderboard} />;
    case "tap":
      return <BullTap onEnd={onEnd} />;
    case "hold":
      return <HoldTheLine onEnd={onEnd} />;
    case "pump":
      return <PumpOrDump onEnd={onEnd} />;
    case "rug":
      return <RugDodge onEnd={onEnd} />;
    case "match":
      return <BullMatch onEnd={onEnd} />;
  }
}

export function Charge() {
  const [tab, setTab] = useState<ArcadeGame>("charge");
  const [board, setBoard] = useState<ArcadeScore[]>([]);
  const [highs, setHighs] = useState(loadHighs());
  const { address } = useWallet();

  useEffect(() => {
    setBoard(loadLeaderboard());
    setHighs(loadHighs());
  }, []);

  const refreshBoard = (rows: ArcadeScore[]) => {
    setBoard(rows);
    setHighs(loadHighs());
  };

  const refreshHighs = () => setHighs(loadHighs());
  const filtered = board.filter((e) => (e.game ?? "charge") === tab).slice(0, 8);
  const totalBest = Object.values(highs).reduce((a, b) => a + b, 0);

  return (
    <section id="charge" className="section-shell section-glow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          kicker="Playground"
          title="Games & daily drops"
          sub="Six arcade games feed the same Herd Points pipeline. Below: spin, GM stamp, and daily trivia — no wallet required for activities."
        />

        <div className="mb-4 flex items-center gap-2 text-sm text-mist">
          <Layers size={14} />
          <span>{GAMES.length} games · combined best {totalBest.toLocaleString()} pts</span>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {GAMES.map((g) => (
            <button
              key={g.id}
              onClick={() => setTab(g.id)}
              className={cn(
                "surface-card-hover relative flex flex-col items-start gap-2 p-4 text-left",
                tab === g.id && "border-gold/35 bg-gold/[0.06] shadow-gold-glow"
              )}
            >
              {g.tag && (
                <span className="absolute right-2 top-2 rounded-full bg-crimson/20 px-1.5 py-0.5 font-mono text-[9px] text-crimson-bright">
                  {g.tag}
                </span>
              )}
              <g.icon size={18} className={tab === g.id ? "text-gold" : "text-mist"} />
              <span className="font-display text-sm font-semibold text-bone">{g.label}</span>
              <span className="text-[11px] text-mist">{g.desc}</span>
              <span className="font-mono text-[10px] text-gold">{highs[g.id].toLocaleString()}</span>
            </button>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <GameView tab={tab} board={board} onLeaderboard={refreshBoard} onEnd={refreshHighs} />
          </motion.div>

          <aside className="surface-card h-fit p-5">
            <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-gold">
              <Trophy size={16} /> {GAME_LABELS[tab]}
            </h3>
            <p className="mt-1 text-xs text-mist">Local leaderboard</p>
            {filtered.length === 0 ? (
              <p className="mt-6 text-center text-xs text-ash">
                No scores yet — <span className="text-gold">be first.</span>
              </p>
            ) : (
              <ol className="mt-4 space-y-1">
                {filtered.map((e, i) => {
                  const isYou = address && e.name === shortAddress(address);
                  return (
                    <li
                      key={`${e.name}-${e.score}-${i}`}
                      className={cn(
                        "flex justify-between border-b border-white/[0.04] py-2 font-mono text-xs last:border-0",
                        isYou && "text-gold"
                      )}
                    >
                      <span>{i + 1}. {e.name}</span>
                      <span className="tabular-nums text-ash">{e.score.toLocaleString()}</span>
                    </li>
                  );
                })}
              </ol>
            )}
          </aside>
        </div>

        <DailyActivities />
      </div>
    </section>
  );
}