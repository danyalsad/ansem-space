"use client";

/**
 * SECTION 2 — CHARGE (The Game)
 * Endless runner on HTML canvas: the Black Bull jumps paperhands and bear
 * traps, collects $ANSEM coins and SOL bags. Space / tap to jump (double
 * jump supported). High score + submitted scores live in localStorage.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Pause, Play, RotateCcw, Share2, Trophy } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/components/WalletProvider";
import { drawBull } from "@/lib/bull";
import { LS, shareOnX } from "@/lib/constants";
import { fireConfetti } from "@/lib/confetti";
import { cn, shortAddress, store } from "@/lib/utils";

/* ---------------- game model ---------------- */

type Phase = "idle" | "running" | "paused" | "over";

interface Entity {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "paperhand" | "beartrap" | "coin" | "solbag";
  collected?: boolean;
}

interface GameState {
  phase: Phase;
  bullY: number;
  bullVy: number;
  jumpsLeft: number;
  speed: number;
  distance: number;
  coins: number;
  entities: Entity[];
  spawnIn: number;
  time: number;
  raf: number;
  last: number;
}

const W = 900;
const H = 340;
const GROUND = H - 56;
const BULL_X = 90;
const BULL_SIZE = 64;
const GRAVITY = 2200;
const JUMP_V = -840;

const FAKE_LEADERBOARD: Array<{ name: string; score: number }> = [
  { name: "blknoiz_disciple", score: 18452 },
  { name: "HoofDaddy", score: 15230 },
  { name: "solana_stampede", score: 12894 },
  { name: "wagmi_wanda", score: 9917 },
  { name: "bearhunter.sol", score: 8340 },
  { name: "kebab_regret", score: 6521 },
  { name: "diamondDoc", score: 5110 },
];

/** Deterministic daily challenge derived from today's date. */
function getDailyChallenge(): { id: string; label: string; check: (s: { coins: number; score: number; time: number }) => boolean } {
  const day = new Date().toISOString().slice(0, 10);
  const seed = day.split("-").reduce((a, b) => a + Number(b), 0);
  const pool = [
    { id: "coins15", label: "Collect 15+ coins in a single run", check: (s: any) => s.coins >= 15 },
    { id: "score2k", label: "Score 2,000+ in a single run", check: (s: any) => s.score >= 2000 },
    { id: "survive45", label: "Survive 45 seconds without getting rekt", check: (s: any) => s.time >= 45 },
    { id: "coins10score1k", label: "10+ coins AND 1,000+ score in one run", check: (s: any) => s.coins >= 10 && s.score >= 1000 },
  ];
  return { ...pool[seed % pool.length], id: `${day}-${pool[seed % pool.length].id}` };
}

/* ---------------- component ---------------- */

export function Charge() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const game = useRef<GameState>({
    phase: "idle",
    bullY: GROUND - BULL_SIZE,
    bullVy: 0,
    jumpsLeft: 2,
    speed: 340,
    distance: 0,
    coins: 0,
    entities: [],
    spawnIn: 1.2,
    time: 0,
    raf: 0,
    last: 0,
  });

  const { address, connect } = useWallet();
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [playerScores, setPlayerScores] = useState<Array<{ name: string; score: number }>>([]);
  const [dailyDone, setDailyDone] = useState(false);
  const daily = useRef(getDailyChallenge());

  useEffect(() => {
    setHighScore(store.get<number>(LS.highScore, 0));
    setPlayerScores(store.get<Array<{ name: string; score: number }>>(LS.playerScores, []));
    setDailyDone(store.get<string[]>(LS.daily, []).includes(daily.current.id));
  }, []);

  /* ---------------- core loop ---------------- */

  const draw = useCallback((g: GameState, ctx: CanvasRenderingContext2D) => {
    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#0A0A0A");
    sky.addColorStop(1, "#16121C");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Parallax grid floor lines
    ctx.strokeStyle = "rgba(255,215,0,0.08)";
    ctx.lineWidth = 1;
    const offset = (g.distance * 0.6) % 48;
    for (let x = -offset; x < W; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND);
      ctx.lineTo(x - 30, H);
      ctx.stroke();
    }

    // Ground
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(0, GROUND, W, 2.5);
    ctx.fillStyle = "rgba(255,215,0,0.06)";
    ctx.fillRect(0, GROUND, W, H - GROUND);

    // Entities
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const e of g.entities) {
      if (e.collected) continue;
      const cx = e.x + e.w / 2;
      const cy = e.y + e.h / 2;
      if (e.kind === "coin") {
        ctx.save();
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.arc(cx, cy, e.w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#0A0A0A";
        ctx.font = "900 15px Impact, sans-serif";
        ctx.fillText("A", cx, cy + 1);
        ctx.restore();
      } else if (e.kind === "solbag") {
        ctx.font = `${e.h}px sans-serif`;
        ctx.fillText("💰", cx, cy);
      } else if (e.kind === "paperhand") {
        ctx.font = `${e.h}px sans-serif`;
        ctx.fillText("🧻", cx, cy);
        ctx.fillStyle = "rgba(255,46,46,0.9)";
        ctx.font = "700 11px monospace";
        ctx.fillText("PAPER", cx, e.y + e.h + 10);
      } else {
        ctx.font = `${e.h}px sans-serif`;
        ctx.fillText("🐻", cx, cy);
        ctx.strokeStyle = "#FF2E2E";
        ctx.lineWidth = 2;
        ctx.strokeRect(e.x, e.y + e.h - 6, e.w, 6);
      }
    }

    // The bull (drawn mark + motion trail)
    ctx.save();
    ctx.globalAlpha = 0.25;
    drawBull(ctx, BULL_X - 22, g.bullY + 6, BULL_SIZE * 0.9, "silhouette");
    ctx.restore();
    drawBull(ctx, BULL_X, g.bullY, BULL_SIZE, "gold");

    // HUD
    ctx.textAlign = "left";
    ctx.fillStyle = "#EDE8DC";
    ctx.font = "700 16px monospace";
    ctx.fillText(`SCORE ${Math.floor(g.distance + g.coins * 100)}`, 16, 26);
    ctx.fillStyle = "#FFD700";
    ctx.fillText(`◉ ${g.coins}`, 16, 48);
  }, []);

  const endRun = useCallback(
    (g: GameState) => {
      g.phase = "over";
      cancelAnimationFrame(g.raf);
      const finalScore = Math.floor(g.distance + g.coins * 100);
      setPhase("over");
      setScore(finalScore);
      setCoins(g.coins);
      setSubmitted(false);

      const prevHigh = store.get<number>(LS.highScore, 0);
      if (finalScore > prevHigh) {
        store.set(LS.highScore, finalScore);
        setHighScore(finalScore);
        fireConfetti({ count: 140 });
      }

      // Daily challenge check
      const d = daily.current;
      if (d.check({ coins: g.coins, score: finalScore, time: g.time })) {
        const done = store.get<string[]>(LS.daily, []);
        if (!done.includes(d.id)) {
          store.set(LS.daily, [...done, d.id]);
          setDailyDone(true);
          fireConfetti({ count: 100 });
        }
      }
    },
    []
  );

  const loop = useCallback(
    (now: number) => {
      const g = game.current;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      if (g.phase !== "running") return;

      const dt = Math.min(0.033, (now - g.last) / 1000 || 0.016);
      g.last = now;
      g.time += dt;

      // Difficulty ramps with time
      g.speed = 340 + Math.min(360, g.time * 14);
      g.distance += g.speed * dt * 0.08;

      // Physics
      g.bullVy += GRAVITY * dt;
      g.bullY += g.bullVy * dt;
      if (g.bullY >= GROUND - BULL_SIZE) {
        g.bullY = GROUND - BULL_SIZE;
        g.bullVy = 0;
        g.jumpsLeft = 2;
      }

      // Spawning
      g.spawnIn -= dt;
      if (g.spawnIn <= 0) {
        const r = Math.random();
        if (r < 0.42) {
          g.entities.push({ x: W + 40, y: GROUND - 44, w: 40, h: 44, kind: "paperhand" });
        } else if (r < 0.68) {
          g.entities.push({ x: W + 40, y: GROUND - 34, w: 46, h: 34, kind: "beartrap" });
        } else if (r < 0.9) {
          // Arc of 3 coins at jump height
          const baseY = GROUND - 130 - Math.random() * 70;
          for (let i = 0; i < 3; i++) {
            g.entities.push({ x: W + 40 + i * 34, y: baseY - Math.sin((i / 2) * Math.PI) * 24, w: 24, h: 24, kind: "coin" });
          }
        } else {
          g.entities.push({ x: W + 40, y: GROUND - 170 - Math.random() * 40, w: 34, h: 34, kind: "solbag" });
        }
        g.spawnIn = Math.max(0.55, 1.4 - g.time * 0.012) * (0.7 + Math.random() * 0.6);
      }

      // Move + collide
      const bull = { x: BULL_X + 10, y: g.bullY + 12, w: BULL_SIZE - 20, h: BULL_SIZE - 16 };
      for (const e of g.entities) {
        e.x -= g.speed * dt;
        if (e.collected) continue;
        const hit =
          bull.x < e.x + e.w && bull.x + bull.w > e.x && bull.y < e.y + e.h && bull.y + bull.h > e.y;
        if (!hit) continue;
        if (e.kind === "coin") {
          e.collected = true;
          g.coins += 1;
        } else if (e.kind === "solbag") {
          e.collected = true;
          g.coins += 5;
        } else {
          draw(g, ctx);
          endRun(g);
          return;
        }
      }
      g.entities = g.entities.filter((e) => e.x > -80 && !e.collected);

      draw(g, ctx);
      g.raf = requestAnimationFrame(loop);
    },
    [draw, endRun]
  );

  const start = useCallback(() => {
    const g = game.current;
    cancelAnimationFrame(g.raf);
    Object.assign(g, {
      phase: "running",
      bullY: GROUND - BULL_SIZE,
      bullVy: 0,
      jumpsLeft: 2,
      speed: 340,
      distance: 0,
      coins: 0,
      entities: [],
      spawnIn: 1.1,
      time: 0,
      last: performance.now(),
    });
    setPhase("running");
    setScore(0);
    g.raf = requestAnimationFrame(loop);
  }, [loop]);

  const togglePause = useCallback(() => {
    const g = game.current;
    if (g.phase === "running") {
      g.phase = "paused";
      cancelAnimationFrame(g.raf);
      setPhase("paused");
    } else if (g.phase === "paused") {
      g.phase = "running";
      g.last = performance.now();
      setPhase("running");
      g.raf = requestAnimationFrame(loop);
    }
  }, [loop]);

  const jump = useCallback(() => {
    const g = game.current;
    if (g.phase === "idle" || g.phase === "over") {
      start();
      return;
    }
    if (g.phase !== "running" || g.jumpsLeft <= 0) return;
    g.bullVy = JUMP_V;
    g.jumpsLeft -= 1;
  }, [start]);

  // Keyboard + initial idle frame
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        // Only hijack space when the game is on screen-ish
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect && rect.top < window.innerHeight && rect.bottom > 0) {
          e.preventDefault();
          jump();
        }
      }
      if (e.code === "KeyP") togglePause();
    };
    window.addEventListener("keydown", onKey);

    // Draw an idle frame so the canvas isn't blank before play.
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) draw(game.current, ctx);

    const g = game.current;
    return () => {
      window.removeEventListener("keydown", onKey);
      cancelAnimationFrame(g.raf);
    };
  }, [jump, togglePause, draw]);

  function submitScore() {
    if (!address || submitted) return;
    const entry = { name: shortAddress(address), score };
    const next = [...playerScores, entry].sort((a, b) => b.score - a.score).slice(0, 10);
    setPlayerScores(next);
    store.set(LS.playerScores, next);
    setSubmitted(true);
    fireConfetti({ count: 90 });
  }

  const leaderboard = [...FAKE_LEADERBOARD, ...playerScores]
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return (
    <section id="charge" className="relative scroll-mt-16 border-t border-edge/50 bg-abyss/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          kicker="Section 02 — The Game"
          title="Charge"
          sub="Run, bull, run. Leap the paperhands, dodge the bear traps, hoover up $ANSEM coins and SOL bags. Space / tap to jump — double-jump is real. P to pause."
        />

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* Game canvas */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="relative cursor-pointer border border-gold/25 shadow-panel [clip-path:polygon(14px_0,100%_0,100%_calc(100%-14px),calc(100%-14px)_100%,0_100%,0_14px)]"
              onPointerDown={(e) => {
                e.preventDefault();
                jump();
              }}
            >
              <canvas ref={canvasRef} width={W} height={H} className="block w-full touch-none select-none" />

              {/* Overlays */}
              {phase === "idle" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-void/70">
                  <p className="font-display text-2xl uppercase tracking-widest text-gold">Ready to charge?</p>
                  <p className="font-mono text-xs text-ash">Space / tap to jump · double jump enabled</p>
                  <Button size="lg" onClick={start}>
                    <Play size={16} /> Start Run
                  </Button>
                </div>
              )}
              {phase === "paused" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-void/70">
                  <p className="font-display text-2xl uppercase tracking-widest text-bone">Paused</p>
                  <Button onClick={togglePause}>
                    <Play size={15} /> Resume
                  </Button>
                </div>
              )}
              {phase === "over" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-void/80 px-4 text-center"
                >
                  <p className="font-display text-lg uppercase tracking-widest text-crimson">Trampled!</p>
                  <p className="font-display text-4xl uppercase text-gold">{score.toLocaleString()}</p>
                  <p className="font-mono text-xs text-ash">
                    {coins} coins · best {Math.max(highScore, score).toLocaleString()}
                  </p>
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    <Button size="sm" onClick={start}>
                      <RotateCcw size={14} /> Run it back
                    </Button>
                    <Button
                      size="sm"
                      variant="crimson"
                      onClick={() =>
                        shareOnX(
                          `Just scored ${score.toLocaleString()} in CHARGE 🐂 — the $ANSEM endless runner. The bull cannot be stopped. Beat me:`
                        )
                      }
                    >
                      <Share2 size={14} /> Flex on X
                    </Button>
                    {address ? (
                      <Button size="sm" variant="outline" onClick={submitScore} disabled={submitted}>
                        <Trophy size={14} /> {submitted ? "Submitted ✓" : "Submit score"}
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={connect}>
                        Connect to submit
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {phase === "running" || phase === "paused" ? (
                <Button size="sm" variant="outline" onClick={togglePause}>
                  {phase === "paused" ? <Play size={14} /> : <Pause size={14} />}
                  {phase === "paused" ? "Resume" : "Pause"}
                </Button>
              ) : null}
              <Button size="sm" variant="ghost" onClick={start}>
                <RotateCcw size={14} /> Restart
              </Button>
              <span className="ml-auto font-mono text-xs text-ash">
                Personal best: <span className="text-gold">{highScore.toLocaleString()}</span>
              </span>
            </div>

            {/* Daily challenge */}
            <div
              className={cn(
                "mt-4 flex items-center justify-between gap-4 border px-4 py-3",
                dailyDone ? "border-gold/50 bg-gold/10" : "border-edge bg-panel"
              )}
            >
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-crimson">
                  Daily challenge
                </p>
                <p className="mt-1 text-sm text-bone">{daily.current.label}</p>
              </div>
              <span className={cn("font-display text-xs uppercase", dailyDone ? "text-gold" : "text-ash")}>
                {dailyDone ? "Complete ✓" : "Incomplete"}
              </span>
            </div>
          </motion.div>

          {/* Leaderboard */}
          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="border border-edge bg-panel p-5 shadow-panel [clip-path:polygon(14px_0,100%_0,100%_calc(100%-14px),calc(100%-14px)_100%,0_100%,0_14px)]"
          >
            <h3 className="flex items-center gap-2 font-display text-sm uppercase tracking-widest text-gold">
              <Trophy size={16} /> Global stampede board
            </h3>
            <p className="mt-1 font-mono text-[10px] text-ash">Simulated — connect wallet to enter</p>
            <ol className="mt-4 space-y-1.5">
              {leaderboard.map((entry, i) => {
                const isPlayer = address && entry.name === shortAddress(address);
                return (
                  <li
                    key={`${entry.name}-${entry.score}`}
                    className={cn(
                      "flex items-center justify-between border-b border-edge/50 px-2 py-2 font-mono text-xs last:border-0",
                      isPlayer && "bg-gold/10 text-gold"
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={cn("w-5 text-right", i < 3 ? "text-gold" : "text-ash")}>
                        {i + 1}
                      </span>
                      <span className={isPlayer ? "text-gold" : "text-bone"}>
                        {entry.name} {isPlayer && "← you"}
                      </span>
                    </span>
                    <span className="tabular-nums text-ash">{entry.score.toLocaleString()}</span>
                  </li>
                );
              })}
            </ol>
          </motion.aside>
        </div>
      </div>
    </section>
  );
}
