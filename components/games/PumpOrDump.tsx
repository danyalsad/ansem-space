"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, Share2, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHerd } from "@/components/HerdProvider";
import { sfx } from "@/lib/arcade-audio";
import { shareOnX } from "@/lib/constants";
import { loadHighs, saveHigh } from "@/lib/games";
import { fireConfetti } from "@/lib/confetti";
import { CRIMSON_BRIGHT } from "@/lib/palette";
import { cn } from "@/lib/utils";

const ROUNDS = 12;

export function PumpOrDump({ onEnd }: { onEnd?: (score: number) => void }) {
  const { earn } = useHerd();
  const [phase, setPhase] = useState<"idle" | "playing" | "reveal" | "over">("idle");
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(() => loadHighs().pump);
  const [hp, setHp] = useState(0);
  const [lastUp, setLastUp] = useState(true);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [pick, setPick] = useState<"pump" | "dump" | null>(null);

  const start = () => {
    setPhase("playing");
    setRound(0);
    setScore(0);
    setStreak(0);
    setHp(0);
    setCorrect(null);
    setPick(null);
  };

  const finish = useCallback(
    (final: number) => {
      setPhase("over");
      const { gained } = earn("game", { score: final });
      setHp(gained);
      if (saveHigh("pump", final)) {
        setBest(final);
        fireConfetti({ count: 80 });
      }
      onEnd?.(final);
    },
    [earn, onEnd]
  );

  const guess = (choice: "pump" | "dump") => {
    if (phase !== "playing") return;
    const up = Math.random() > 0.46;
    setLastUp(up);
    setPick(choice);
    const hit = (choice === "pump" && up) || (choice === "dump" && !up);
    setCorrect(hit);
    setPhase("reveal");
    sfx.tap();

    setTimeout(() => {
      const nextStreak = hit ? streak + 1 : 0;
      const mult = Math.min(4, 1 + nextStreak * 0.25);
      const pts = hit ? Math.floor(100 * mult) : 0;
      const nextScore = score + pts;
      const nextRound = round + 1;
      setStreak(nextStreak);
      setScore(nextScore);
      setRound(nextRound);
      setPick(null);
      setCorrect(null);
      if (hit) sfx.coin();
      else sfx.miss();
      if (nextRound >= ROUNDS) finish(nextScore);
      else setPhase("playing");
    }, 900);
  };

  return (
    <div className="surface-card overflow-hidden p-6 sm:p-8">
      {phase === "idle" && (
        <div className="text-center">
          <p className="font-display text-xl font-bold text-bone">Pump or Dump</p>
          <p className="mt-2 text-sm text-mist">
            {ROUNDS} rounds · call the candle before it reveals · streaks multiply score
          </p>
          <Button className="mt-6" onClick={start}><Play size={14} /> Start</Button>
          <p className="mt-4 font-mono text-xs text-gold">Best {best.toLocaleString()}</p>
        </div>
      )}

      {(phase === "playing" || phase === "reveal") && (
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-mist">Round {round + 1}/{ROUNDS}</span>
            <span className="font-mono text-gold">{score} pts</span>
            {streak >= 2 && <span className="text-crimson-bright">x{streak} streak</span>}
          </div>

          <div className="relative mx-auto mt-8 flex h-48 w-full max-w-xs items-end justify-center gap-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${round}-${phase}`}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                className={cn(
                  "w-16 origin-bottom rounded-t-lg",
                  phase === "reveal" ? (lastUp ? "bg-green-500/80" : "bg-crimson/80") : "bg-white/10"
                )}
                style={{ height: phase === "reveal" ? (lastUp ? "75%" : "35%") : "55%" }}
              />
            </AnimatePresence>
            {phase === "reveal" && correct !== null && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("absolute -top-2 font-display text-lg font-bold", correct ? "text-gold" : "text-crimson-bright")}
              >
                {correct ? "Correct!" : "Wrong"}
              </motion.p>
            )}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <button
              disabled={phase === "reveal"}
              onClick={() => guess("pump")}
              className="flex items-center justify-center gap-2 rounded-2xl border border-green-500/30 bg-green-500/10 py-5 font-semibold text-green-400 transition-all hover:bg-green-500/20 disabled:opacity-50"
            >
              <TrendingUp size={18} /> Pump
            </button>
            <button
              disabled={phase === "reveal"}
              onClick={() => guess("dump")}
              className="flex items-center justify-center gap-2 rounded-2xl border border-crimson/30 bg-crimson/10 py-5 font-semibold text-crimson-bright transition-all hover:bg-crimson/20 disabled:opacity-50"
            >
              <TrendingDown size={18} /> Dump
            </button>
          </div>
          {pick && phase === "reveal" && (
            <p className="mt-3 text-center text-xs text-mist">You picked {pick.toUpperCase()}</p>
          )}
        </div>
      )}

      {phase === "over" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <p className="font-display text-3xl font-bold text-gold">{score}</p>
          <p className="mt-2 text-sm text-mist">Best {Math.max(best, score).toLocaleString()}</p>
          {hp > 0 && <p className="mt-2 text-gold">+{hp} HP</p>}
          <div className="mt-4 flex justify-center gap-2">
            <Button size="sm" onClick={start}><RotateCcw size={14} /> Again</Button>
            <Button size="sm" variant="crimson" onClick={() => shareOnX(`Scored ${score} in PUMP OR DUMP 📈 on ANSEM Space`)}>
              <Share2 size={14} /> Share
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}