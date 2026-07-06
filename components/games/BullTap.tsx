"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, RotateCcw, Share2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHerd } from "@/components/HerdProvider";
import { sfx } from "@/lib/arcade-audio";
import { shareOnX } from "@/lib/constants";
import { loadHighs, saveHigh } from "@/lib/games";
import { fireConfetti } from "@/lib/confetti";
import { GOLD, GOLD_BRIGHT, GREEN, VOID } from "@/lib/palette";
import { drawBull } from "@/lib/bull";
import { cn } from "@/lib/utils";

const W = 900;
const H = 340;
const ROUND = 30;
const FRENZY_AT = 5;

interface Target {
  id: number;
  x: number;
  y: number;
  r: number;
  life: number;
  maxLife: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export function BullTap({ onEnd }: { onEnd?: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { earn } = useHerd();
  const [phase, setPhase] = useState<"idle" | "playing" | "over">("idle");
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND);
  const [hp, setHp] = useState(0);
  const [best, setBest] = useState(0);
  const [frenzy, setFrenzy] = useState(false);
  const state = useRef({
    targets: [] as Target[],
    sparks: [] as Spark[],
    time: ROUND,
    hits: 0,
    misses: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    spawnIn: 0.5,
    id: 0,
    raf: 0,
    last: 0,
    chartOff: 0,
  });

  useEffect(() => {
    setBest(loadHighs().tap);
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const st = state.current;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, VOID);
    g.addColorStop(1, "#1a1020");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Scrolling candle chart backdrop
    st.chartOff += 1.2;
    const baseY = H * 0.72;
    for (let i = 0; i < 18; i++) {
      const x = ((i * 52 - st.chartOff) % (W + 60)) - 30;
      const h = 20 + (i % 5) * 14;
      const up = i % 3 !== 0;
      ctx.fillStyle = up ? "rgba(22,199,132,0.12)" : "rgba(200,16,46,0.12)";
      ctx.fillRect(x + 18, baseY - h, 14, h);
      ctx.fillRect(x + 22, baseY - (up ? h + 8 : 0), 6, 8);
    }

    if (st.time <= FRENZY_AT) {
      ctx.fillStyle = "rgba(255,46,46,0.08)";
      ctx.fillRect(0, 0, W, H);
      ctx.font = "900 28px Impact, sans-serif";
      ctx.fillStyle = "rgba(255,46,46,0.35)";
      ctx.textAlign = "center";
      ctx.fillText("FRENZY!", W / 2, H / 2 - 40);
    }

    for (const s of st.sparks) {
      ctx.globalAlpha = Math.max(0, s.life);
      ctx.fillStyle = GOLD_BRIGHT;
      ctx.fillRect(s.x, s.y, 3, 3);
    }
    ctx.globalAlpha = 1;

    for (const t of st.targets) {
      const urgency = 1 - t.life / t.maxLife;
      const pulse = 0.88 + Math.sin(t.life * 16) * 0.12 + urgency * 0.08;
      const r = t.r * pulse;
      ctx.save();
      ctx.shadowColor = urgency > 0.7 ? "#FF2E2E" : GOLD_BRIGHT;
      ctx.shadowBlur = 12 + urgency * 16;
      drawBull(ctx, t.x - r / 2, t.y - r / 2, r, "gold");
      ctx.restore();
      ctx.strokeStyle = `rgba(255,46,46,${0.35 + urgency * 0.55})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(t.x, t.y, r * 0.68, -Math.PI / 2, -Math.PI / 2 + (t.life / t.maxLife) * Math.PI * 2);
      ctx.stroke();
    }

    ctx.textAlign = "left";
    ctx.fillStyle = "#F2EFE9";
    ctx.font = "700 18px monospace";
    ctx.fillText(`TAPS ${st.hits}`, 16, 28);
    ctx.fillStyle = GOLD;
    ctx.fillText(`SCORE ${st.score}`, 16, 52);
    if (st.combo >= 2) {
      ctx.fillStyle = "#FF2E2E";
      ctx.font = "900 16px Impact, sans-serif";
      ctx.fillText(`x${st.combo} STREAK`, 16, 76);
    }
  }, []);

  const endGame = useCallback(() => {
    cancelAnimationFrame(state.current.raf);
    const s = state.current.score;
    setPhase("over");
    setScore(s);
    setFrenzy(false);
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
      setFrenzy(st.time <= FRENZY_AT);

      const frenzyMul = st.time <= FRENZY_AT ? 0.55 : 1;
      st.spawnIn -= dt;
      if (st.spawnIn <= 0 && st.time > 0) {
        st.id++;
        const pad = 65;
        st.targets.push({
          id: st.id,
          x: pad + Math.random() * (W - pad * 2),
          y: pad + Math.random() * (H - pad * 2),
          r: 40 + Math.random() * 18,
          life: 0,
          maxLife: (st.time <= FRENZY_AT ? 0.55 : 0.85 + Math.random() * 0.45) * frenzyMul,
        });
        const elapsed = ROUND - st.time;
        st.spawnIn = Math.max(0.28, (st.time <= FRENZY_AT ? 0.38 : 0.75) - elapsed * 0.012);
      }

      for (const t of st.targets) t.life += dt;
      const expired = st.targets.filter((t) => t.life >= t.maxLife);
      for (const t of expired) {
        st.misses++;
        st.combo = 0;
        st.score = Math.max(0, st.score - 12);
        sfx.miss();
      }
      st.targets = st.targets.filter((t) => t.life < t.maxLife);
      setHits(st.hits);
      setMisses(st.misses);
      setScore(st.score);
      setCombo(st.combo);

      for (const s of st.sparks) {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life -= dt * 2.5;
      }
      st.sparks = st.sparks.filter((s) => s.life > 0);

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
      sparks: [],
      time: ROUND,
      hits: 0,
      misses: 0,
      score: 0,
      combo: 0,
      maxCombo: 0,
      spawnIn: 0.35,
      id: 0,
      last: performance.now(),
      chartOff: 0,
    });
    setHits(0);
    setMisses(0);
    setScore(0);
    setCombo(0);
    setTimeLeft(ROUND);
    setHp(0);
    setFrenzy(false);
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
        if (dx * dx + dy * dy < t.r * t.r * 1.1) {
          const urgency = 1 - t.life / t.maxLife;
          const comboMult = Math.min(4, 1 + st.combo * 0.25);
          const frenzyMult = st.time <= FRENZY_AT ? 2 : 1;
          const bonus = Math.floor(urgency * 50);
          st.hits++;
          st.combo++;
          st.maxCombo = Math.max(st.maxCombo, st.combo);
          st.score += Math.floor((50 + bonus) * comboMult * frenzyMult);
          st.targets.splice(i, 1);
          hit = true;
          for (let j = 0; j < 8; j++) {
            st.sparks.push({
              x: t.x,
              y: t.y,
              vx: (Math.random() - 0.5) * 300,
              vy: (Math.random() - 0.5) * 300,
              life: 0.4,
            });
          }
          if (st.combo >= 3) sfx.combo(st.combo);
          else sfx.tap();
          break;
        }
      }
      if (!hit) {
        st.misses++;
        st.combo = 0;
        st.score = Math.max(0, st.score - 6);
        sfx.miss();
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
        className={cn(
          "relative cursor-crosshair border border-gold/25 horn-clip touch-none select-none",
          frenzy && phase === "playing" && "border-crimson/50 shadow-[0_0_24px_rgba(200,16,46,0.25)]"
        )}
        onPointerDown={(e) => {
          e.preventDefault();
          onTap(e.clientX, e.clientY);
        }}
      >
        <canvas ref={canvasRef} width={W} height={H} className="block w-full" />
        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-void/75">
            <p className="font-display text-xl uppercase tracking-widest text-gold">Bull Tap</p>
            <p className="font-mono text-xs text-ash">Tap bulls before they vanish · build streaks · last 5s = 2× frenzy</p>
            <Button onClick={start}><Play size={14} /> Start</Button>
          </div>
        )}
        {phase === "over" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-void/85">
            <p className="font-display text-3xl text-gold">{score}</p>
            <p className="font-mono text-xs text-ash">
              {hits} hits · {misses} misses · max x{state.current.maxCombo} · best {best}
            </p>
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
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-4 py-3">
            <span className={cn("font-display text-2xl", frenzy ? "text-crimson-bright animate-pulse" : "text-bone")}>
              {timeLeft}s
            </span>
            {combo >= 2 && (
              <span className="flex items-center gap-1 font-display text-sm text-gold">
                <Zap size={14} /> x{combo}
              </span>
            )}
            {frenzy && (
              <span className="font-display text-xs uppercase tracking-widest text-crimson-bright">Frenzy 2×</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}