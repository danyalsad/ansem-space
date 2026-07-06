"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Pause, Play, RotateCcw, Share2, Shield, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/components/WalletProvider";
import { useHerd } from "@/components/HerdProvider";
import { drawBull } from "@/lib/bull";
import { slotUrl } from "@/lib/asset-manifest";
import { LS, shareOnX } from "@/lib/constants";
import { loadHighs, saveHigh, submitScore, type ArcadeScore } from "@/lib/games";
import { BONE, CRIMSON_BRIGHT, GOLD, GOLD_BRIGHT, VOID } from "@/lib/palette";
import { fireConfetti } from "@/lib/confetti";
import { claimDailyChallenge } from "@/lib/quests";
import { cn, shortAddress, store } from "@/lib/utils";

type Phase = "idle" | "running" | "paused" | "over";
type EntityKind = "paperhand" | "beartrap" | "coin" | "solbag" | "shield" | "magnet";

interface Entity {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: EntityKind;
  collected?: boolean;
}

interface Popup {
  x: number;
  y: number;
  text: string;
  life: number;
}

interface GameState {
  popups: Popup[];
  phase: Phase;
  bullY: number;
  bullVy: number;
  jumpsLeft: number;
  speed: number;
  distance: number;
  coins: number;
  bonus: number;
  combo: number;
  comboTimer: number;
  shield: number;
  magnetT: number;
  invulnT: number;
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

type SpriteKey = "bull" | "paperhand" | "beartrap" | "coin" | "solbag";
const SPRITE_SLOTS: Record<string, SpriteKey> = {
  "sprite-bull-runner": "bull",
  "sprite-paperhand": "paperhand",
  "sprite-beartrap": "beartrap",
  "sprite-coin": "coin",
  "sprite-solbag": "solbag",
};

function getDailyChallenge() {
  const day = new Date().toISOString().slice(0, 10);
  const seed = day.split("-").reduce((a, b) => a + Number(b), 0);
  const pool = [
    { id: "coins15", label: "Collect 15+ coins in a single run", check: (s: { coins: number; score: number; time: number }) => s.coins >= 15 },
    { id: "score2k", label: "Score 2,000+ in a single run", check: (s: { coins: number; score: number; time: number }) => s.score >= 2000 },
    { id: "survive45", label: "Survive 45 seconds without getting rekt", check: (s: { coins: number; score: number; time: number }) => s.time >= 45 },
    { id: "coins10score1k", label: "10+ coins AND 1,000+ score in one run", check: (s: { coins: number; score: number; time: number }) => s.coins >= 10 && s.score >= 1000 },
  ];
  return { ...pool[seed % pool.length], id: `${day}-${pool[seed % pool.length].id}` };
}

function calcScore(g: GameState) {
  return Math.floor(g.distance + g.coins * 100 + g.bonus);
}

export function ChargeRunner({
  leaderboard,
  onLeaderboard,
}: {
  leaderboard: ArcadeScore[];
  onLeaderboard: (rows: ArcadeScore[]) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shake, setShake] = useState(false);
  const game = useRef<GameState>({
    popups: [],
    phase: "idle",
    bullY: GROUND - BULL_SIZE,
    bullVy: 0,
    jumpsLeft: 2,
    speed: 340,
    distance: 0,
    coins: 0,
    bonus: 0,
    combo: 0,
    comboTimer: 0,
    shield: 0,
    magnetT: 0,
    invulnT: 0,
    entities: [],
    spawnIn: 1.2,
    time: 0,
    raf: 0,
    last: 0,
  });

  const { address, connect } = useWallet();
  const { earn, grantBonus } = useHerd();
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [hpEarned, setHpEarned] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [dailyDone, setDailyDone] = useState(false);
  const daily = useRef(getDailyChallenge());
  const sprites = useRef<Partial<Record<SpriteKey, HTMLImageElement>>>({});

  useEffect(() => {
    const load = (slot: string, key: SpriteKey, url: string) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => { sprites.current[key] = img; };
      img.src = url;
    };
    fetch("/api/assets")
      .then((r) => r.json())
      .then((json) => {
        for (const [slot, key] of Object.entries(SPRITE_SLOTS)) {
          const s = json.slots?.[slot];
          load(slot, key, s?.url ? `${s.url}?v=${s.uploadedAt}` : slotUrl(slot));
        }
      })
      .catch(() => {
        for (const [slot, key] of Object.entries(SPRITE_SLOTS)) {
          load(slot, key, slotUrl(slot));
        }
      });
    setHighScore(loadHighs().charge);
    setDailyDone(store.get<string[]>(LS.daily, []).includes(daily.current.id));
  }, []);

  const draw = useCallback((g: GameState, ctx: CanvasRenderingContext2D) => {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, VOID);
    sky.addColorStop(1, "#16121C");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Parallax silhouettes
    ctx.fillStyle = "rgba(212,175,55,0.04)";
    for (let i = 0; i < 5; i++) {
      const px = ((i * 200 - (g.distance * 0.15) % 200) + W) % W - 50;
      ctx.beginPath();
      ctx.moveTo(px, GROUND);
      ctx.lineTo(px + 60, GROUND - 40 - (i % 3) * 15);
      ctx.lineTo(px + 120, GROUND);
      ctx.fill();
    }

    const offset = (g.distance * 0.6) % 48;
    ctx.strokeStyle = "rgba(212,175,55,0.1)";
    for (let x = -offset; x < W; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND);
      ctx.lineTo(x - 30, H);
      ctx.stroke();
    }

    ctx.fillStyle = GOLD;
    ctx.fillRect(0, GROUND, W, 3);
    ctx.fillStyle = "rgba(212,175,55,0.08)";
    ctx.fillRect(0, GROUND, W, H - GROUND);

    for (const e of g.entities) {
      if (e.collected) continue;
      const cx = e.x + e.w / 2;
      const cy = e.y + e.h / 2;
      if (e.kind === "coin") {
        const coin = sprites.current.coin;
        if (coin) ctx.drawImage(coin, e.x, e.y, e.w, e.h);
        else {
          ctx.fillStyle = GOLD;
          ctx.beginPath();
          ctx.arc(cx, cy, e.w / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (e.kind === "solbag") {
        const bag = sprites.current.solbag;
        if (bag) ctx.drawImage(bag, e.x, e.y, e.w, e.h);
        else { ctx.font = `${e.h}px sans-serif`; ctx.textAlign = "center"; ctx.fillText("💰", cx, cy); }
      } else if (e.kind === "paperhand") {
        const ph = sprites.current.paperhand;
        if (ph) ctx.drawImage(ph, e.x, e.y, e.w, e.h);
        else { ctx.font = `${e.h}px sans-serif`; ctx.textAlign = "center"; ctx.fillText("🧻", cx, cy); }
      } else if (e.kind === "beartrap") {
        const bear = sprites.current.beartrap;
        if (bear) ctx.drawImage(bear, e.x, e.y, e.w, e.h);
        else { ctx.font = `${e.h}px sans-serif`; ctx.textAlign = "center"; ctx.fillText("🐻", cx, cy); }
      } else if (e.kind === "shield") {
        ctx.fillStyle = "rgba(100,180,255,0.25)";
        ctx.strokeStyle = "#6ec8ff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, e.w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#6ec8ff";
        ctx.font = "700 14px monospace";
        ctx.textAlign = "center";
        ctx.fillText("🛡", cx, cy + 1);
      } else if (e.kind === "magnet") {
        ctx.fillStyle = "rgba(212,175,55,0.2)";
        ctx.strokeStyle = GOLD_BRIGHT;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, e.w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.font = "700 14px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = GOLD;
        ctx.fillText("🧲", cx, cy + 1);
      }
    }

    let drawY = g.bullY;
    if (g.bullY >= GROUND - BULL_SIZE - 1 && g.phase === "running") {
      drawY += Math.sin(g.time * 14) * 3;
    }

    const bullImg = sprites.current.bull;
    if (g.magnetT > 0) {
      ctx.strokeStyle = `rgba(212,175,55,${0.3 + Math.sin(g.time * 10) * 0.15})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(BULL_X + BULL_SIZE / 2, drawY + BULL_SIZE / 2, BULL_SIZE * 0.85, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (g.shield > 0) {
      ctx.strokeStyle = "rgba(110,200,255,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(BULL_X + BULL_SIZE / 2, drawY + BULL_SIZE / 2, BULL_SIZE * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (bullImg) {
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.drawImage(bullImg, BULL_X - 18, drawY + 8, BULL_SIZE * 0.9, BULL_SIZE * 0.9);
      ctx.restore();
      ctx.drawImage(bullImg, BULL_X, drawY, BULL_SIZE, BULL_SIZE);
    } else {
      drawBull(ctx, BULL_X, drawY, BULL_SIZE, "gold");
    }

    ctx.textAlign = "center";
    for (const p of g.popups) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = GOLD_BRIGHT;
      ctx.font = "900 18px Impact, sans-serif";
      ctx.fillText(p.text, p.x, p.y - (1 - p.life) * 40);
      ctx.restore();
    }

    ctx.textAlign = "left";
    ctx.fillStyle = BONE;
    ctx.font = "700 15px monospace";
    ctx.fillText(`SCORE ${calcScore(g)}`, 14, 24);
    ctx.fillStyle = GOLD;
    ctx.fillText(`◉ ${g.coins}`, 14, 46);
    ctx.fillStyle = "#9A95A3";
    ctx.fillText(`⏱ ${g.time.toFixed(1)}s`, 14, 68);
    if (g.combo >= 2) {
      ctx.fillStyle = CRIMSON_BRIGHT;
      ctx.fillText(`COMBO x${Math.min(g.combo, 8)}`, 14, 90);
    }
    if (g.shield > 0) {
      ctx.fillStyle = "#6ec8ff";
      ctx.fillText(`🛡 x${g.shield}`, W - 90, 24);
    }
    if (g.magnetT > 0) {
      ctx.fillStyle = GOLD_BRIGHT;
      ctx.fillText(`🧲 ${g.magnetT.toFixed(1)}s`, W - 90, 46);
    }
  }, []);

  const endRun = useCallback(
    (g: GameState) => {
      g.phase = "over";
      cancelAnimationFrame(g.raf);
      const finalScore = calcScore(g);
      setPhase("over");
      setScore(finalScore);
      setCoins(g.coins);
      setSubmitted(false);
      setShake(true);
      setTimeout(() => setShake(false), 400);

      const { gained } = earn("game", { score: finalScore });
      setHpEarned(gained);
      if (saveHigh("charge", finalScore)) {
        setHighScore(finalScore);
        fireConfetti({ count: 140 });
      }

      const d = daily.current;
      if (d.check({ coins: g.coins, score: finalScore, time: g.time })) {
        const done = store.get<string[]>(LS.daily, []);
        if (!done.includes(d.id)) {
          store.set(LS.daily, [...done, d.id]);
          setDailyDone(true);
          const bonus = claimDailyChallenge(address);
          if (bonus) grantBonus(bonus.gained, bonus.label);
          fireConfetti({ count: 100 });
        }
      }
    },
    [address, earn, grantBonus]
  );

  const collectCoin = (g: GameState, e: Entity, mult: number) => {
    e.collected = true;
    g.coins += 1;
    g.comboTimer = 1.4;
    g.combo = Math.min(8, g.combo + 1);
    const pts = 100 * mult;
    g.bonus += pts - 100;
    g.popups.push({ x: e.x + e.w / 2, y: e.y, text: mult > 1 ? `+${pts} x${mult}` : "+100", life: 1 });
  };

  const loop = useCallback(
    (now: number) => {
      const g = game.current;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx || g.phase !== "running") return;

      const dt = Math.min(0.033, (now - g.last) / 1000 || 0.016);
      g.last = now;
      g.time += dt;
      if (g.comboTimer > 0) g.comboTimer -= dt;
      else g.combo = 0;
      if (g.magnetT > 0) g.magnetT -= dt;
      if (g.invulnT > 0) g.invulnT -= dt;

      g.speed = 340 + Math.min(400, g.time * 16);
      g.distance += g.speed * dt * 0.08;

      g.bullVy += GRAVITY * dt;
      g.bullY += g.bullVy * dt;
      if (g.bullY >= GROUND - BULL_SIZE) {
        g.bullY = GROUND - BULL_SIZE;
        g.bullVy = 0;
        g.jumpsLeft = 2;
      }

      g.spawnIn -= dt;
      if (g.spawnIn <= 0) {
        const r = Math.random();
        if (r < 0.38) {
          g.entities.push({ x: W + 40, y: GROUND - 44, w: 40, h: 44, kind: "paperhand" });
        } else if (r < 0.62) {
          g.entities.push({ x: W + 40, y: GROUND - 34, w: 46, h: 34, kind: "beartrap" });
        } else if (r < 0.82) {
          const baseY = GROUND - 130 - Math.random() * 70;
          for (let i = 0; i < 3; i++) {
            g.entities.push({ x: W + 40 + i * 34, y: baseY - Math.sin((i / 2) * Math.PI) * 24, w: 26, h: 26, kind: "coin" });
          }
        } else if (r < 0.9) {
          g.entities.push({ x: W + 40, y: GROUND - 170 - Math.random() * 40, w: 34, h: 34, kind: "solbag" });
        } else if (r < 0.96) {
          g.entities.push({ x: W + 40, y: GROUND - 120, w: 32, h: 32, kind: "shield" });
        } else {
          g.entities.push({ x: W + 40, y: GROUND - 150, w: 32, h: 32, kind: "magnet" });
        }
        g.spawnIn = Math.max(0.5, 1.35 - g.time * 0.011) * (0.65 + Math.random() * 0.55);
      }

      const mult = Math.max(1, g.combo);
      const bull = { x: BULL_X + 10, y: g.bullY + 12, w: BULL_SIZE - 20, h: BULL_SIZE - 16 };

      if (g.magnetT > 0) {
        for (const e of g.entities) {
          if (e.collected || e.kind !== "coin") continue;
          const dx = bull.x + bull.w / 2 - (e.x + e.w / 2);
          const dy = bull.y + bull.h / 2 - (e.y + e.h / 2);
          const dist = Math.hypot(dx, dy);
          if (dist < 160 && dist > 4) {
            e.x += (dx / dist) * 420 * dt;
            e.y += (dy / dist) * 420 * dt;
          }
        }
      }

      for (const e of g.entities) {
        e.x -= g.speed * dt;
        if (e.collected) continue;
        const hit =
          bull.x < e.x + e.w && bull.x + bull.w > e.x && bull.y < e.y + e.h && bull.y + bull.h > e.y;
        if (!hit) continue;

        if (e.kind === "coin") collectCoin(g, e, mult);
        else if (e.kind === "solbag") {
          e.collected = true;
          g.coins += 5;
          g.bonus += 400;
          g.popups.push({ x: e.x + e.w / 2, y: e.y, text: "+500 SOL!", life: 1 });
        } else if (e.kind === "shield") {
          e.collected = true;
          g.shield = Math.min(2, g.shield + 1);
          g.popups.push({ x: e.x + e.w / 2, y: e.y, text: "SHIELD!", life: 1 });
        } else if (e.kind === "magnet") {
          e.collected = true;
          g.magnetT = 5;
          g.popups.push({ x: e.x + e.w / 2, y: e.y, text: "MAGNET!", life: 1 });
        } else if (g.invulnT > 0) {
          /* pass through */
        } else if (g.shield > 0) {
          g.shield--;
          g.invulnT = 1.2;
          e.collected = true;
          g.popups.push({ x: bull.x, y: bull.y, text: "BLOCKED!", life: 1 });
        } else {
          draw(g, ctx);
          endRun(g);
          return;
        }
      }
      g.entities = g.entities.filter((e) => e.x > -80 && !e.collected);
      for (const p of g.popups) p.life -= dt * 1.4;
      g.popups = g.popups.filter((p) => p.life > 0);

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
      popups: [],
      bullY: GROUND - BULL_SIZE,
      bullVy: 0,
      jumpsLeft: 2,
      speed: 340,
      distance: 0,
      coins: 0,
      bonus: 0,
      combo: 0,
      comboTimer: 0,
      shield: 0,
      magnetT: 0,
      invulnT: 0,
      entities: [],
      spawnIn: 1,
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
    if (g.phase === "idle" || g.phase === "over") { start(); return; }
    if (g.phase !== "running" || g.jumpsLeft <= 0) return;
    g.bullVy = JUMP_V;
    g.jumpsLeft -= 1;
  }, [start]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || rect.top >= window.innerHeight || rect.bottom <= 0) return;
      if (e.code === "Space") { e.preventDefault(); jump(); }
      if (e.code === "KeyP") togglePause();
    };
    window.addEventListener("keydown", onKey);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) draw(game.current, ctx);
    return () => {
      window.removeEventListener("keydown", onKey);
      cancelAnimationFrame(game.current.raf);
    };
  }, [jump, togglePause, draw]);

  function doSubmit() {
    if (!address || submitted) return;
    const rows = submitScore({ name: shortAddress(address), score, game: "charge" });
    onLeaderboard(rows);
    setSubmitted(true);
    fireConfetti({ count: 90 });
  }

  return (
    <div>
      <div
        className={cn("relative cursor-pointer border border-gold/25 horn-clip touch-none select-none", shake && "animate-[shake_0.4s_ease-in-out]")}
        onPointerDown={(e) => { e.preventDefault(); jump(); }}
        style={shake ? { animation: "shake 0.35s ease-in-out" } : undefined}
      >
        <canvas ref={canvasRef} width={W} height={H} className="block w-full" />
        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-void/75">
            <p className="font-display text-2xl uppercase tracking-widest text-gold">Charge</p>
            <p className="max-w-xs text-center font-mono text-[11px] text-ash">
              Double jump · combo coins · 🛡 shield · 🧲 magnet power-ups
            </p>
            <Button size="lg" onClick={start}><Play size={16} /> Start Run</Button>
          </div>
        )}
        {phase === "paused" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-void/75">
            <p className="font-display text-xl uppercase text-bone">Paused</p>
            <Button onClick={togglePause}><Play size={15} /> Resume</Button>
          </div>
        )}
        {phase === "over" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-void/85 px-4 text-center">
            <p className="font-display text-lg uppercase text-crimson">Trampled!</p>
            <p className="font-display text-4xl text-gold">{score.toLocaleString()}</p>
            <p className="font-mono text-xs text-ash">{coins} coins · best {Math.max(highScore, score).toLocaleString()}</p>
            {hpEarned > 0 && <p className="border border-gold/40 bg-gold/10 px-3 py-1 font-display text-sm text-gold">+{hpEarned} HP</p>}
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <Button size="sm" onClick={start}><RotateCcw size={14} /> Run again</Button>
              <Button size="sm" variant="crimson" onClick={() => shareOnX(`Scored ${score} in CHARGE 🐂 on ANSEM Space — beat me:`)}>
                <Share2 size={14} /> Share
              </Button>
              {address ? (
                <Button size="sm" variant="outline" onClick={doSubmit} disabled={submitted}>
                  <Trophy size={14} /> {submitted ? "Submitted ✓" : "Submit"}
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={connect}>Connect to submit</Button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-mono text-ash">
        <span className="flex items-center gap-1"><Shield size={10} className="text-[#6ec8ff]" /> Shield blocks 1 hit</span>
        <span className="flex items-center gap-1"><Zap size={10} className="text-gold" /> Magnet pulls coins 5s</span>
        <span className="flex items-center gap-1 text-crimson-bright">Combo streak = bigger coin value</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {(phase === "running" || phase === "paused") && (
          <Button size="sm" variant="outline" onClick={togglePause}>
            {phase === "paused" ? <Play size={14} /> : <Pause size={14} />}
            {phase === "paused" ? "Resume" : "Pause"}
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={start}><RotateCcw size={14} /> Restart</Button>
        <span className="ml-auto font-mono text-xs text-ash">Best: <span className="text-gold">{highScore.toLocaleString()}</span></span>
      </div>

      <div className={cn("mt-3 flex items-center justify-between gap-4 border px-4 py-3 horn-clip-sm", dailyDone ? "border-gold/50 bg-gold/10" : "border-edge bg-panel")}>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-crimson">Daily challenge</p>
          <p className="mt-0.5 text-sm text-bone">{daily.current.label}</p>
        </div>
        <span className={cn("font-display text-xs uppercase", dailyDone ? "text-gold" : "text-ash")}>
          {dailyDone ? "✓ +50 HP" : "Incomplete"}
        </span>
      </div>
    </div>
  );
}