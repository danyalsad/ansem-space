"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, RotateCcw, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHerd } from "@/components/HerdProvider";
import { shareOnX } from "@/lib/constants";
import { loadHighs, saveHigh } from "@/lib/games";
import { fireConfetti } from "@/lib/confetti";
import { GOLD, GOLD_BRIGHT, VOID } from "@/lib/palette";
import { drawBull } from "@/lib/bull";

const W = 900;
const H = 340;
const ROUND = 30;

interface Target {
  id: number;
  x: number;
  y: number;
  r: number;
  life: number;
  maxLife: number;
}

export function BullTap({ onEnd }: { onEnd?: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { earn } = useHerd();
  const [phase, setPhase] = useState<"idle" | "playing" | "over">("idle");
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND);
  const [hp, setHp] = useState(0);
  const [best, setBest] = useState(0);
  const state = useRef({
    targets: [] as Target[],
    time: ROUND,
    hits: 0,
    misses: 0,
    score: 0,
    spawnIn: 0.6,
    id: 0,
    raf: 0,
    last: 0,
  });

  useEffect(() => {
    setBest(loadHighs().tap);
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, VOID);
    g.addColorStop(1, "#1a1020");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    for (const t of state.current.targets) {
      const pulse = 0.85 + Math.sin(t.life * 14) * 0.15;
      const r = t.r * pulse;
      ctx.save();
      ctx.shadowColor = GOLD_BRIGHT;
      ctx.shadowBlur = 18;
      drawBull(ctx, t.x - r / 2, t.y - r / 2, r, "gold");
      ctx.restore();
      // Timer ring
      ctx.strokeStyle = `rgba(255,46,46,${0.4 + (1 - t.life / t.maxLife) * 0.6})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(t.x, t.y, r * 0.65, -Math.PI / 2, -Math.PI / 2 + (t.life / t.maxLife) * Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = "#F2EFE9";
    ctx.font = "700 18px monospace";
    ctx.fillText(`TAPS ${state.current.hits}`, 16, 28);
    ctx.fillStyle = GOLD;
    ctx.fillText(`SCORE ${state.current.score}`, 16, 52);
  }, []);

  const endGame = useCallback(() => {
    cancelAnimationFrame(state.current.raf);
    const s = state.current.score;
    setPhase("over");
    setScore(s);
    const { gained } = earn("game", { score: s });
    setHp(gained);
    if (saveHigh("tap", s)) {
      setBest(s);
      fireConfetti({ count: 100 });
    }
    onEnd?.(s);
  }, [earn, onEnd]);

  const loop = useCallback(
    (now: number) => {
      const st = state.current;
      const dt = Math.min(0.033, (now - st.last) / 1000 || 0.016);
      st.last = now;
      st.time -= dt;
      setTimeLeft(Math.ceil(st.time));

      st.spawnIn -= dt;
      if (st.spawnIn <= 0 && st.time > 0) {
        st.id++;
        const pad = 70;
        st.targets.push({
          id: st.id,
          x: pad + Math.random() * (W - pad * 2),
          y: pad + Math.random() * (H - pad * 2),
          r: 44 + Math.random() * 16,
          life: 0,
          maxLife: 0.9 + Math.random() * 0.5,
        });
        st.spawnIn = Math.max(0.35, 0.85 - (ROUND - st.time) * 0.015);
      }

      for (const t of st.targets) t.life += dt;
      const expired = st.targets.filter((t) => t.life >= t.maxLife);
      for (const _ of expired) {
        st.misses++;
        st.score = Math.max(0, st.score - 15);
      }
      st.targets = st.targets.filter((t) => t.life < t.maxLife);
      setHits(st.hits);
      setMisses(st.misses);
      setScore(st.score);

      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) draw(ctx);

      if (st.time <= 0) {
        endGame();
        return;
      }
      st.raf = requestAnimationFrame(loop);
    },
    [draw, endGame]
  );

  const start = useCallback(() => {
    cancelAnimationFrame(state.current.raf);
    Object.assign(state.current, {
      targets: [],
      time: ROUND,
      hits: 0,
      misses: 0,
      score: 0,
      spawnIn: 0.4,
      id: 0,
      last: performance.now(),
    });
    setHits(0);
    setMisses(0);
    setScore(0);
    setTimeLeft(ROUND);
    setHp(0);
    setPhase("playing");
    state.current.raf = requestAnimationFrame(loop);
  }, [loop]);

  const onTap = useCallback(
    (clientX: number, clientY: number) => {
      if (phase === "idle" || phase === "over") {
        start();
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * W;
      const y = ((clientY - rect.top) / rect.height) * H;
      const st = state.current;
      let hit = false;
      for (let i = st.targets.length - 1; i >= 0; i--) {
        const t = st.targets[i];
        const dx = x - t.x;
        const dy = y - t.y;
        if (dx * dx + dy * dy < t.r * t.r) {
          const bonus = Math.floor((1 - t.life / t.maxLife) * 40);
          st.hits++;
          st.score += 50 + bonus;
          st.targets.splice(i, 1);
          hit = true;
          break;
        }
      }
      if (!hit) {
        st.misses++;
        st.score = Math.max(0, st.score - 8);
      }
    },
    [phase, start]
  );

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && phase === "idle") draw(ctx);
    return () => cancelAnimationFrame(state.current.raf);
  }, [draw, phase]);

  return (
    <div>
      <div
        className="relative cursor-crosshair border border-gold/25 horn-clip touch-none select-none"
        onPointerDown={(e) => {
          e.preventDefault();
          onTap(e.clientX, e.clientY);
        }}
      >
        <canvas ref={canvasRef} width={W} height={H} className="block w-full" />
        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-void/75">
            <p className="font-display text-xl uppercase tracking-widest text-gold">Bull Tap</p>
            <p className="font-mono text-xs text-ash">Tap the bulls before they vanish · 30 seconds</p>
            <Button onClick={start}><Play size={14} /> Start</Button>
          </div>
        )}
        {phase === "over" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-void/85">
            <p className="font-display text-3xl text-gold">{score}</p>
            <p className="font-mono text-xs text-ash">{hits} hits · {misses} misses · best {best}</p>
            {hp > 0 && <p className="text-sm text-gold">+{hp} HP</p>}
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={start}><RotateCcw size={14} /> Again</Button>
              <Button size="sm" variant="crimson" onClick={() => shareOnX(`Scored ${score} in BULL TAP 👆🐂 on ANSEM Space`)}>
                <Share2 size={14} /> Share
              </Button>
            </div>
          </motion.div>
        )}
        {phase === "playing" && (
          <div className="pointer-events-none absolute right-4 top-4 font-display text-2xl text-crimson-bright">
            {timeLeft}s
          </div>
        )}
      </div>
    </div>
  );
}