"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, RotateCcw, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHerd } from "@/components/HerdProvider";
import { sfx } from "@/lib/arcade-audio";
import { shareOnX } from "@/lib/constants";
import { loadHighs, saveHigh } from "@/lib/games";
import { fireConfetti } from "@/lib/confetti";
import { drawBull } from "@/lib/bull";
import { VOID, GOLD, CRIMSON_BRIGHT } from "@/lib/palette";

const W = 700;
const H = 380;
const PLAYER_W = 56;

interface Rug {
  x: number;
  y: number;
  w: number;
  h: number;
  vy: number;
}

export function RugDodge({ onEnd }: { onEnd?: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { earn } = useHerd();
  const [phase, setPhase] = useState<"idle" | "playing" | "over">("idle");
  const [score, setScore] = useState(0);
  const [hp, setHp] = useState(0);
  const [best, setBest] = useState(0);
  const state = useRef({
    px: W / 2 - PLAYER_W / 2,
    rugs: [] as Rug[],
    time: 0,
    spawnIn: 0.8,
    raf: 0,
    last: 0,
  });

  useEffect(() => {
    setBest(loadHighs().rug);
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, VOID);
    g.addColorStop(1, "#140f18");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    for (const r of state.current.rugs) {
      ctx.fillStyle = "rgba(200,16,46,0.25)";
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.font = `${r.h * 0.7}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("🧻", r.x + r.w / 2, r.y + r.h * 0.75);
    }

    drawBull(ctx, state.current.px, H - 68, PLAYER_W, "gold");

    ctx.fillStyle = "#F4F2EC";
    ctx.font = "700 16px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`${Math.floor(state.current.time * 10)}`, 14, 26);
    ctx.fillStyle = GOLD;
    ctx.fillText(`${Math.floor(state.current.time * 10)} pts`, 14, 48);
  }, []);

  const endGame = useCallback(() => {
    cancelAnimationFrame(state.current.raf);
    const s = Math.floor(state.current.time * 10);
    setScore(s);
    setPhase("over");
    const { gained } = earn("game", { score: s });
    setHp(gained);
    if (saveHigh("rug", s)) {
      setBest(s);
      fireConfetti({ count: 90 });
    }
    onEnd?.(s);
  }, [earn, onEnd]);

  const loop = useCallback(
    (now: number) => {
      const st = state.current;
      const dt = Math.min(0.033, (now - st.last) / 1000 || 0.016);
      st.last = now;
      st.time += dt;
      st.spawnIn -= dt;

      if (st.spawnIn <= 0) {
        st.rugs.push({
          x: 40 + Math.random() * (W - 120),
          y: -40,
          w: 36 + Math.random() * 28,
          h: 28 + Math.random() * 16,
          vy: 140 + st.time * 12 + Math.random() * 60,
        });
        st.spawnIn = Math.max(0.35, 0.9 - st.time * 0.02);
      }

      const bull = { x: st.px + 8, y: H - 60, w: PLAYER_W - 16, h: 48 };
      for (const r of st.rugs) {
        r.y += r.vy * dt;
        if (
          r.y + r.h > bull.y &&
          r.y < bull.y + bull.h &&
          r.x + r.w > bull.x &&
          r.x < bull.x + bull.w
        ) {
          sfx.hit();
          endGame();
          return;
        }
      }
      st.rugs = st.rugs.filter((r) => r.y < H + 20);

      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) draw(ctx);
      st.raf = requestAnimationFrame(loop);
    },
    [draw, endGame]
  );

  const start = useCallback(() => {
    cancelAnimationFrame(state.current.raf);
    Object.assign(state.current, {
      px: W / 2 - PLAYER_W / 2,
      rugs: [],
      time: 0,
      spawnIn: 0.6,
      last: performance.now(),
    });
    setScore(0);
    setHp(0);
    setPhase("playing");
    state.current.raf = requestAnimationFrame(loop);
  }, [loop]);

  const move = (dir: -1 | 1) => {
    if (phase !== "playing") return;
    state.current.px = Math.max(8, Math.min(W - PLAYER_W - 8, state.current.px + dir * 28));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== "playing") return;
      if (e.code === "ArrowLeft") move(-1);
      if (e.code === "ArrowRight") move(1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      cancelAnimationFrame(state.current.raf);
    };
  }, [phase]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && phase === "idle") draw(ctx);
  }, [draw, phase]);

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-white/10">
        <canvas ref={canvasRef} width={W} height={H} className="block w-full touch-none" />
        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-void/80">
            <p className="font-display text-xl font-bold text-bone">Rug Dodge</p>
            <p className="text-sm text-mist">Dodge falling paper hands · survive for max score</p>
            <Button onClick={start}><Play size={14} /> Start</Button>
          </div>
        )}
        {phase === "over" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-void/90">
            <p className="font-display text-3xl font-bold text-crimson-bright">Rugged!</p>
            <p className="font-display text-4xl text-gold">{score}</p>
            {hp > 0 && <p className="text-sm text-gold">+{hp} HP · best {best}</p>}
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={start}><RotateCcw size={14} /> Again</Button>
              <Button size="sm" variant="crimson" onClick={() => shareOnX(`Survived ${score} pts in RUG DODGE 🧻 on ANSEM Space`)}>
                <Share2 size={14} /> Share
              </Button>
            </div>
          </motion.div>
        )}
      </div>
      {phase === "playing" && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onPointerDown={() => move(-1)} className="rounded-2xl border border-white/10 py-4 text-bone active:bg-white/5">
            <ChevronLeft className="mx-auto" />
          </button>
          <button type="button" onPointerDown={() => move(1)} className="rounded-2xl border border-white/10 py-4 text-bone active:bg-white/5">
            <ChevronRight className="mx-auto" />
          </button>
        </div>
      )}
    </div>
  );
}