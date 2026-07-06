"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Gem, Play, RotateCcw, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHerd } from "@/components/HerdProvider";
import { shareOnX } from "@/lib/constants";
import { loadHighs, saveHigh } from "@/lib/games";
import { fireConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";

export function HoldTheLine({ onEnd }: { onEnd?: (score: number) => void }) {
  const { earn } = useHerd();
  const [phase, setPhase] = useState<"idle" | "holding" | "over">("idle");
  const [pressure, setPressure] = useState(0);
  const [held, setHeld] = useState(0);
  const [score, setScore] = useState(0);
  const [hp, setHp] = useState(0);
  const [best, setBest] = useState(0);
  const [result, setResult] = useState<"diamond" | "paper" | "early">("diamond");
  const raf = useRef(0);
  const startTime = useRef(0);

  useEffect(() => {
    setBest(loadHighs().hold);
  }, []);

  const finish = useCallback(
    (p: number, secs: number, why: "diamond" | "paper" | "early") => {
      cancelAnimationFrame(raf.current);
      let s = Math.floor(secs * 120);
      if (why === "diamond" && p >= 72 && p <= 94) s += 500;
      if (why === "early") s = Math.floor(s * 0.5);
      setScore(s);
      setResult(why);
      setPhase("over");
      const { gained } = earn("game", { score: s });
      setHp(gained);
      if (saveHigh("hold", s)) {
        setBest(s);
        fireConfetti({ count: why === "diamond" ? 120 : 40 });
      }
      onEnd?.(s);
    },
    [earn, onEnd]
  );

  const tick = useCallback(() => {
    const elapsed = (performance.now() - startTime.current) / 1000;
    setHeld(elapsed);
    // Pressure ramps — release in the sweet zone (72–94%) for max score
    const p = Math.min(100, elapsed * 28 + elapsed * elapsed * 4);
    setPressure(p);
    if (p >= 100) {
      finish(p, elapsed, "paper");
      return;
    }
    raf.current = requestAnimationFrame(tick);
  }, [finish]);

  const startHold = useCallback(() => {
    if (phase !== "holding") return;
    setPressure(0);
    setHeld(0);
    startTime.current = performance.now();
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(tick);
  }, [phase, tick]);

  const release = useCallback(() => {
    if (phase !== "holding") return;
    const elapsed = (performance.now() - startTime.current) / 1000;
    const p = Math.min(100, elapsed * 28 + elapsed * elapsed * 4);
    if (p < 25) finish(p, elapsed, "early");
    else if (p >= 72 && p <= 94) finish(p, elapsed, "diamond");
    else if (p < 72) finish(p, elapsed, "early");
    else finish(p, elapsed, "paper");
  }, [phase, finish]);

  const reset = () => {
    cancelAnimationFrame(raf.current);
    setPhase("idle");
    setPressure(0);
    setHeld(0);
    setScore(0);
    setHp(0);
  };

  return (
    <div className="border border-gold/25 bg-panel horn-clip p-6 sm:p-8">
      {phase === "idle" && (
        <div className="text-center">
          <Gem size={32} className="mx-auto text-gold" />
          <h3 className="mt-3 font-display text-xl uppercase tracking-widest text-gold">Hold the Line</h3>
          <p className="mt-2 text-sm text-ash">
            Hold the button as pressure builds. Release in the <span className="text-gold">diamond zone (72–94%)</span> for
            max HP — too long and paperhands win.
          </p>
          <Button className="mt-6" size="lg" onClick={() => setPhase("holding")}>
            <Play size={16} /> Ready
          </Button>
        </div>
      )}

      {(phase === "holding" || phase === "over") && (
        <div className="mx-auto max-w-md">
          <div className="relative h-8 overflow-hidden border border-edge bg-void">
            <div
              className={cn(
                "absolute inset-y-0 left-0 transition-none",
                pressure >= 72 && pressure <= 94 ? "bg-gold/60" : pressure >= 100 ? "bg-crimson" : "bg-gold/30"
              )}
              style={{ width: `${pressure}%` }}
            />
            <div className="absolute inset-y-0 border-l-2 border-gold/80" style={{ left: "72%" }} />
            <div className="absolute inset-y-0 border-l-2 border-gold/80" style={{ left: "94%" }} />
          </div>
          <div className="mt-1 flex justify-between font-mono text-[9px] text-ash">
            <span>Paperhand danger →</span>
            <span className="text-gold">◆ DIAMOND ZONE ◆</span>
            <span>← Too early</span>
          </div>
          <p className="mt-4 text-center font-mono text-2xl tabular-nums text-bone">
            {held.toFixed(1)}s · {Math.floor(pressure)}%
          </p>

          {phase === "holding" && (
            <button
              className="mt-6 w-full border-2 border-gold bg-gold/15 py-14 font-display text-lg uppercase tracking-[0.3em] text-gold transition-all active:scale-95 active:bg-gold/30 active:shadow-gold-glow select-none touch-none"
              onPointerDown={(e) => {
                e.preventDefault();
                startHold();
              }}
              onPointerUp={release}
              onPointerLeave={release}
            >
              💎 HOLD
            </button>
          )}

          {phase === "over" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-center">
              <p className={cn("font-display text-lg uppercase", result === "diamond" ? "text-gold" : result === "paper" ? "text-crimson-bright" : "text-ash")}>
                {result === "diamond" ? "💎 Diamond Hands!" : result === "paper" ? "🧻 Paperhanded!" : "Released too early"}
              </p>
              <p className="mt-2 font-display text-4xl text-gold">{score}</p>
              {hp > 0 && <p className="mt-1 text-sm text-gold">+{hp} HP · best {best}</p>}
              <div className="mt-4 flex justify-center gap-2">
                <Button size="sm" onClick={reset}><RotateCcw size={14} /> Again</Button>
                <Button size="sm" variant="crimson" onClick={() => shareOnX(`Held the line for ${held.toFixed(1)}s 💎 — ${score} pts on ANSEM Space`)}>
                  <Share2 size={14} /> Share
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}