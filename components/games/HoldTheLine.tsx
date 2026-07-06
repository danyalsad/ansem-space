"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Gem, Play, RotateCcw, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHerd } from "@/components/HerdProvider";
import { sfx } from "@/lib/arcade-audio";
import { shareOnX } from "@/lib/constants";
import { loadHighs, saveHigh } from "@/lib/games";
import { fireConfetti } from "@/lib/confetti";
import { VOID } from "@/lib/palette";
import { cn } from "@/lib/utils";

export function HoldTheLine({ onEnd }: { onEnd?: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { earn } = useHerd();
  const [phase, setPhase] = useState<"idle" | "holding" | "over">("idle");
  const [pressure, setPressure] = useState(0);
  const [held, setHeld] = useState(0);
  const [score, setScore] = useState(0);
  const [hp, setHp] = useState(0);
  const [best, setBest] = useState(0);
  const [result, setResult] = useState<"diamond" | "paper" | "early">("diamond");
  const [holding, setHolding] = useState(false);
  const raf = useRef(0);
  const startTime = useRef(0);
  const chart = useRef({ off: 0, candles: [] as { x: number; h: number; up: boolean }[] });

  useEffect(() => {
    setBest(loadHighs().hold);
    const c: { x: number; h: number; up: boolean }[] = [];
    for (let i = 0; i < 24; i++) {
      c.push({ x: i * 28, h: 16 + Math.random() * 40, up: Math.random() > 0.38 });
    }
    chart.current.candles = c;
  }, []);

  const drawChart = useCallback((p: number, pulse: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, VOID);
    g.addColorStop(1, "#14101c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    chart.current.off += 0.6;
    const base = H * 0.78;
    for (const c of chart.current.candles) {
      const x = ((c.x - chart.current.off) % (W + 40)) - 20;
      ctx.fillStyle = c.up ? "rgba(22,199,132,0.2)" : "rgba(200,16,46,0.18)";
      ctx.fillRect(x, base - c.h, 12, c.h);
    }

    // Pressure line climbing like a live chart
    ctx.strokeStyle = `rgba(212,175,55,${0.35 + pulse * 0.25})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 40; i++) {
      const t = i / 39;
      const px = t * W;
      const py = base - (t * p * 0.006 * H * 0.55);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    if (p >= 72 && p <= 94) {
      ctx.fillStyle = `rgba(212,175,55,${0.06 + pulse * 0.06})`;
      ctx.fillRect(W * 0.72, 0, W * 0.22, H);
    }
  }, []);

  const finish = useCallback(
    (p: number, secs: number, why: "diamond" | "paper" | "early") => {
      cancelAnimationFrame(raf.current);
      setHolding(false);
      let s = Math.floor(secs * 120);
      if (why === "diamond" && p >= 72 && p <= 94) s += 500;
      if (why === "early") s = Math.floor(s * 0.5);
      setScore(s);
      setResult(why);
      setPhase("over");
      if (why === "diamond") sfx.diamond();
      else if (why === "paper") sfx.paper();
      else sfx.miss();
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
    const p = Math.min(100, elapsed * 28 + elapsed * elapsed * 4);
    setPressure(p);
    const inZone = p >= 72 && p <= 94;
    if (inZone && Math.floor(elapsed * 4) % 4 === 0) sfx.holdPulse();
    drawChart(p, inZone ? 0.5 + Math.sin(elapsed * 8) * 0.5 : 0);
    if (p >= 100) {
      finish(p, elapsed, "paper");
      return;
    }
    raf.current = requestAnimationFrame(tick);
  }, [finish, drawChart]);

  const startHold = useCallback(() => {
    if (phase !== "holding") return;
    setHolding(true);
    setPressure(0);
    setHeld(0);
    startTime.current = performance.now();
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(tick);
  }, [phase, tick]);

  const release = useCallback(() => {
    if (phase !== "holding" || !holding) return;
    setHolding(false);
    const elapsed = (performance.now() - startTime.current) / 1000;
    const p = Math.min(100, elapsed * 28 + elapsed * elapsed * 4);
    if (p < 25) finish(p, elapsed, "early");
    else if (p >= 72 && p <= 94) finish(p, elapsed, "diamond");
    else if (p < 72) finish(p, elapsed, "early");
    else finish(p, elapsed, "paper");
  }, [phase, holding, finish]);

  const reset = () => {
    cancelAnimationFrame(raf.current);
    setPhase("idle");
    setPressure(0);
    setHeld(0);
    setScore(0);
    setHp(0);
    setHolding(false);
    drawChart(0, 0);
  };

  useEffect(() => {
    if (phase === "idle") drawChart(0, 0);
    return () => cancelAnimationFrame(raf.current);
  }, [phase, drawChart]);

  const inDiamond = pressure >= 72 && pressure <= 94;

  return (
    <div className="border border-gold/25 bg-panel horn-clip overflow-hidden">
      <canvas ref={canvasRef} width={600} height={120} className="block w-full opacity-80" />

      <div className="p-6 sm:p-8">
        {phase === "idle" && (
          <div className="text-center">
            <Gem size={32} className="mx-auto text-gold" />
            <h3 className="mt-3 font-display text-xl uppercase tracking-widest text-gold">Hold the Line</h3>
            <p className="mt-2 text-sm text-ash">
              Pressure builds like a live chart. Release in the <span className="text-gold">diamond zone (72–94%)</span> —
              hold too long and you paperhand.
            </p>
            <Button className="mt-6" size="lg" onClick={() => setPhase("holding")}>
              <Play size={16} /> Ready
            </Button>
          </div>
        )}

        {(phase === "holding" || phase === "over") && (
          <div className="mx-auto max-w-md">
            <div className="relative h-10 overflow-hidden border border-edge bg-void">
              <div
                className={cn(
                  "absolute inset-y-0 left-0 transition-none",
                  inDiamond && holding ? "bg-gold/70" : pressure >= 100 ? "bg-crimson" : "bg-gold/30"
                )}
                style={{ width: `${pressure}%` }}
              />
              <div className="absolute inset-y-0 bg-gold/10" style={{ left: "72%", width: "22%" }} />
              <div className="absolute inset-y-0 border-l-2 border-gold/80" style={{ left: "72%" }} />
              <div className="absolute inset-y-0 border-l-2 border-gold/80" style={{ left: "94%" }} />
              {inDiamond && holding && (
                <div className="absolute inset-y-0 flex items-center justify-center font-mono text-[9px] uppercase tracking-[0.3em] text-void/80"
                  style={{ left: "72%", width: "22%" }}>
                  ◆ diamond ◆
                </div>
              )}
            </div>
            <div className="mt-1 flex justify-between font-mono text-[9px] text-ash">
              <span>← Too early</span>
              <span className="text-gold">Sweet spot</span>
              <span>Paperhand →</span>
            </div>
            <p className="mt-4 text-center font-mono text-2xl tabular-nums text-bone">
              {held.toFixed(1)}s · <span className={inDiamond && holding ? "text-gold" : ""}>{Math.floor(pressure)}%</span>
            </p>

            {phase === "holding" && (
              <button
                className={cn(
                  "mt-6 w-full border-2 py-14 font-display text-lg uppercase tracking-[0.3em] transition-all select-none touch-none",
                  holding
                    ? inDiamond
                      ? "border-gold bg-gold/25 text-gold shadow-gold-glow scale-[1.01]"
                      : "border-gold bg-gold/15 text-gold active:scale-95"
                    : "border-gold/50 bg-gold/10 text-gold/80"
                )}
                onPointerDown={(e) => {
                  e.preventDefault();
                  startHold();
                }}
                onPointerUp={release}
                onPointerLeave={release}
              >
                {holding ? (inDiamond ? "💎 HOLD — RELEASE!" : "💎 HOLDING…") : "💎 PRESS & HOLD"}
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
    </div>
  );
}