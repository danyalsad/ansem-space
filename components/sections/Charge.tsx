"use client";

/**
 * SECTION — ARCADE (Charge + Bull Tap + Hold the Line)
 * Three mini-games, one HP pipeline. Tab between games; shared stampede board.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Gamepad2, Gem, Trophy, Zap } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { ChargeRunner } from "@/components/games/ChargeRunner";
import { BullTap } from "@/components/games/BullTap";
import { HoldTheLine } from "@/components/games/HoldTheLine";
import { loadHighs, loadLeaderboard, GAME_LABELS, type ArcadeGame, type ArcadeScore } from "@/lib/games";
import { useWallet } from "@/components/WalletProvider";
import { cn, shortAddress } from "@/lib/utils";

const TABS: { id: ArcadeGame; label: string; icon: typeof Gamepad2; desc: string }[] = [
  { id: "charge", label: "Charge", icon: Gamepad2, desc: "Endless runner · combos & power-ups" },
  { id: "tap", label: "Bull Tap", icon: Zap, desc: "30s reflex · tap the bulls" },
  { id: "hold", label: "Hold the Line", icon: Gem, desc: "Diamond hands · release in the zone" },
];

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

  const filtered = board.filter((e) => (e.game ?? "charge") === tab).slice(0, 8);

  return (
    <section id="charge" className="relative scroll-mt-16 border-t border-edge/50 bg-abyss/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          kicker="Section 02 — Arcade"
          title="The Arcade"
          sub="Three ways to earn Herd Points. Charge through obstacles, tap bulls on reflex, or hold the line like a true diamond hand. Every run counts toward quests."
          index="02"
        />

        {/* Game picker */}
        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-start gap-3 border p-4 text-left transition-all horn-clip-sm",
                tab === t.id
                  ? "border-gold/50 bg-gold/10 shadow-gold-glow"
                  : "border-edge bg-panel hover:border-gold/30"
              )}
            >
              <t.icon size={20} className={tab === t.id ? "text-gold" : "text-ash"} />
              <span>
                <span className="block font-display text-sm uppercase tracking-wide text-bone">{t.label}</span>
                <span className="mt-0.5 block font-mono text-[10px] text-ash">{t.desc}</span>
                <span className="mt-1 block font-mono text-[10px] text-gold">
                  Best: {highs[t.id].toLocaleString()}
                </span>
              </span>
            </button>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
          >
            {tab === "charge" && (
              <ChargeRunner leaderboard={board} onLeaderboard={refreshBoard} />
            )}
            {tab === "tap" && (
              <BullTap onEnd={() => setHighs(loadHighs())} />
            )}
            {tab === "hold" && (
              <HoldTheLine onEnd={() => setHighs(loadHighs())} />
            )}
          </motion.div>

          <aside className="border border-edge bg-panel p-5 shadow-panel horn-clip">
            <h3 className="flex items-center gap-2 font-display text-sm uppercase tracking-widest text-gold">
              <Trophy size={16} /> {GAME_LABELS[tab]} board
            </h3>
            <p className="mt-1 font-mono text-[10px] text-ash">Top runs on this device</p>
            {filtered.length === 0 ? (
              <p className="mt-6 text-center text-xs text-ash">
                No scores yet — <span className="text-gold">claim the board.</span>
              </p>
            ) : (
              <ol className="mt-4 space-y-1">
                {filtered.map((e, i) => {
                  const isYou = address && e.name === shortAddress(address);
                  return (
                    <li
                      key={`${e.name}-${e.score}-${i}`}
                      className={cn(
                        "flex justify-between border-b border-edge/40 py-2 font-mono text-xs last:border-0",
                        isYou && "text-gold"
                      )}
                    >
                      <span>
                        {i + 1}. {e.name} {isYou && "←"}
                      </span>
                      <span className="tabular-nums text-ash">{e.score.toLocaleString()}</span>
                    </li>
                  );
                })}
              </ol>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}