"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, RotateCcw, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHerd } from "@/components/HerdProvider";
import { sfx } from "@/lib/arcade-audio";
import { shareOnX } from "@/lib/constants";
import { loadHighs, saveHigh } from "@/lib/games";
import { fireConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";

const SYMBOLS = ["🐂", "💎", "🚀", "🧻", "📈", "🔥", "👑", "🎯"];

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function BullMatch({ onEnd }: { onEnd?: (score: number) => void }) {
  const { earn } = useHerd();
  const [phase, setPhase] = useState<"idle" | "playing" | "over">("idle");
  const [cards, setCards] = useState<{ id: number; sym: string; flipped: boolean; matched: boolean }[]>([]);
  const [open, setOpen] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [secs, setSecs] = useState(0);
  const [score, setScore] = useState(0);
  const [hp, setHp] = useState(0);
  const [best, setBest] = useState(0);

  useEffect(() => {
    setBest(loadHighs().match);
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const start = () => {
    const deck = shuffle(SYMBOLS.flatMap((sym, i) => [
      { id: i * 2, sym, flipped: false, matched: false },
      { id: i * 2 + 1, sym, flipped: false, matched: false },
    ]));
    setCards(deck);
    setOpen([]);
    setMoves(0);
    setSecs(0);
    setScore(0);
    setHp(0);
    setPhase("playing");
  };

  const finish = useCallback(
    (final: number) => {
      setScore(final);
      setPhase("over");
      const { gained } = earn("game", { score: final });
      setHp(gained);
      if (saveHigh("match", final)) {
        setBest(final);
        fireConfetti({ count: 100 });
      }
      onEnd?.(final);
    },
    [earn, onEnd]
  );

  const flip = (idx: number) => {
    if (phase !== "playing" || open.length >= 2) return;
    const c = cards[idx];
    if (c.flipped || c.matched) return;

    const next = cards.map((card, i) => (i === idx ? { ...card, flipped: true } : card));
    const nextOpen = [...open, idx];
    setCards(next);
    setOpen(nextOpen);
    sfx.tap();

    if (nextOpen.length === 2) {
      const nextMoves = moves + 1;
      setMoves(nextMoves);
      const [a, b] = nextOpen;
      if (next[a].sym === next[b].sym) {
        sfx.coin();
        const matched = next.map((card, i) =>
          i === a || i === b ? { ...card, matched: true, flipped: true } : card
        );
        setCards(matched);
        setOpen([]);
        if (matched.every((card) => card.matched)) {
          const final = Math.max(100, 1200 - nextMoves * 25 - secs * 8);
          setTimeout(() => finish(final), 400);
        }
      } else {
        sfx.miss();
        setTimeout(() => {
          setCards((cur) =>
            cur.map((card, i) => (i === a || i === b ? { ...card, flipped: false } : card))
          );
          setOpen([]);
        }, 650);
      }
    }
  };

  return (
    <div className="surface-card p-6">
      {phase === "idle" && (
        <div className="text-center">
          <p className="font-display text-xl font-bold text-bone">Bull Match</p>
          <p className="mt-2 text-sm text-mist">Flip pairs · fewer moves & faster time = higher score</p>
          <Button className="mt-6" onClick={start}><Play size={14} /> Start</Button>
          <p className="mt-4 font-mono text-xs text-gold">Best {best.toLocaleString()}</p>
        </div>
      )}

      {phase === "playing" && (
        <>
          <div className="mb-4 flex justify-between font-mono text-xs text-mist">
            <span>{moves} moves</span>
            <span>{secs}s</span>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {cards.map((c, i) => (
              <button
                key={c.id}
                onClick={() => flip(i)}
                className={cn(
                  "aspect-square rounded-xl border text-2xl transition-all sm:text-3xl",
                  c.matched
                    ? "border-gold/30 bg-gold/10"
                    : c.flipped
                      ? "border-white/15 bg-surface"
                      : "border-white/10 bg-panel hover:border-gold/25"
                )}
              >
                {c.flipped || c.matched ? c.sym : "?"}
              </button>
            ))}
          </div>
        </>
      )}

      {phase === "over" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <p className="font-display text-3xl font-bold text-gold">{score}</p>
          <p className="mt-2 text-sm text-mist">{moves} moves · {secs}s · best {Math.max(best, score)}</p>
          {hp > 0 && <p className="mt-2 text-gold">+{hp} HP</p>}
          <div className="mt-4 flex justify-center gap-2">
            <Button size="sm" onClick={start}><RotateCcw size={14} /> Again</Button>
            <Button size="sm" variant="crimson" onClick={() => shareOnX(`Scored ${score} in BULL MATCH 🐂 on ANSEM Space`)}>
              <Share2 size={14} /> Share
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}