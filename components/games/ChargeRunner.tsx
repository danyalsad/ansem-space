"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play, RotateCcw, Share2, Shield, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/components/WalletProvider";
import { useHerd } from "@/components/HerdProvider";
import { drawBull } from "@/lib/bull";
import { slotUrl } from "@/lib/asset-manifest";
import { LS, shareOnX } from "@/lib/constants";
import { loadHighs, saveHigh, submitScore, type ArcadeScore } from "@/lib/games";
import { BONE, CRIMSON, CRIMSON_BRIGHT, GOLD, GOLD_BRIGHT, VOID } from "@/lib/palette";
import { fireConfetti } from "@/lib/confetti";
import { claimDailyChallenge } from "@/lib/quests";
import { cn, shortAddress, store } from "@/lib/utils";

/* ── tuning (game feel) ── */
const W = 900;
const H = 420;
const GROUND = H - 72;
const BULL_X = 100;
const BULL_SIZE = 76;
const GRAVITY = 2400;
const JUMP_V = -880;
const JUMP_CUT = 0.42;
const COYOTE_S = 0.16;
const BUFFER_S = 0.18;
const MAX_SPEED = 460;
const BASE_SPEED = 240;
const WARMUP_S = 5;

type Phase = "idle" | "countdown" | "running" | "paused" | "over";
type EntityKind = "paperhand" | "beartrap" | "coin" | "solbag" | "shield" | "magnet";

interface Entity {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: EntityKind;
  collected?: boolean;
  spin?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface Popup {
  x: number;
  y: number;
  text: string;
  life: number;
  scale: number;
}

interface GameState {
  phase: Phase;
  popups: Popup[];
  particles: Particle[];
  bullY: number;
  bullVy: number;
  jumpsLeft: number;
  coyoteT: number;
  bufferT: number;
  jumpBuffered: boolean;
  jumpHeld: boolean;
  jumpCutApplied: boolean;
  deathReason: string;
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
  sinceObstacle: number;
  countdown: number;
  flashT: number;
  raf: number;
  last: number;
}

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

function burst(g: GameState, x: number, y: number, color: string, n = 8) {
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
    g.particles.push({
      x,
      y,
      vx: Math.cos(a) * (80 + Math.random() * 120),
      vy: Math.sin(a) * (80 + Math.random() * 120) - 40,
      life: 0.5 + Math.random() * 0.3,
      color,
      size: 2 + Math.random() * 3,
    });
  }
}

function freshState(): GameState {
  return {
    phase: "idle",
    popups: [],
    particles: [],
    bullY: GROUND - BULL_SIZE,
    bullVy: 0,
    jumpsLeft: 2,
    coyoteT: 0,
    bufferT: 0,
    jumpBuffered: false,
    jumpHeld: false,
    jumpCutApplied: false,
    deathReason: "",
    speed: BASE_SPEED,
    distance: 0,
    coins: 0,
    bonus: 0,
    combo: 0,
    comboTimer: 0,
    shield: 0,
    magnetT: 0,
    invulnT: 0,
    entities: [],
    spawnIn: 1.8,
    time: 0,
    sinceObstacle: 99,
    countdown: 3,
    flashT: 0,
    raf: 0,
    last: 0,
  };
}

export function ChargeRunner({
  onLeaderboard,
}: {
  leaderboard: ArcadeScore[];
  onLeaderboard: (rows: ArcadeScore[]) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const game = useRef<GameState>(freshState());
  const sprites = useRef<Partial<Record<SpriteKey, HTMLImageElement>>>({});
  const daily = useRef(getDailyChallenge());

  const { address, connect } = useWallet();
  const { earn, grantBonus } = useHerd();
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdownN, setCountdownN] = useState(3);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [hpEarned, setHpEarned] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [dailyDone, setDailyDone] = useState(false);
  const [shake, setShake] = useState(false);

  /* HiDPI canvas */
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = wrap.getBoundingClientRect();
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${(rect.width * H) / W}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawFrame(game.current, ctx);
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

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

  const hurtbox = (g: GameState) => ({
    x: BULL_X + 22,
    y: g.bullY + 24,
    w: BULL_SIZE - 44,
    h: BULL_SIZE - 36,
  });

  const collectHit = (bull: ReturnType<typeof hurtbox>, e: Entity) => {
    const cx = e.x + e.w / 2;
    const cy = e.y + e.h / 2;
    const bx = bull.x + bull.w / 2;
    const by = bull.y + bull.h / 2;
    const pad = e.kind === "coin" || e.kind === "solbag" || e.kind === "shield" || e.kind === "magnet" ? 1.5 : 0.85;
    const dx = Math.abs(cx - bx);
    const dy = Math.abs(cy - by);
    return dx < (bull.w / 2 + (e.w / 2) * pad) && dy < (bull.h / 2 + (e.h / 2) * pad);
  };

  const drawFrame = useCallback((g: GameState, ctx: CanvasRenderingContext2D) => {
    if (g.flashT > 0) {
      ctx.fillStyle = `rgba(255,255,255,${g.flashT * 0.35})`;
      ctx.fillRect(0, 0, W, H);
    }

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#050508");
    sky.addColorStop(0.55, VOID);
    sky.addColorStop(1, "#1a1220");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Distant city
    ctx.fillStyle = "rgba(212,175,55,0.05)";
    for (let i = 0; i < 8; i++) {
      const px = ((i * 140 - g.distance * 0.12) % (W + 140)) - 70;
      const h = 30 + (i % 4) * 18;
      ctx.fillRect(px, GROUND - h, 50 + (i % 3) * 20, h);
    }

    // Speed streaks
    if (g.speed > 380) {
      ctx.strokeStyle = `rgba(212,175,55,${Math.min(0.25, (g.speed - 380) / 600)})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const sy = 40 + i * 55;
        const sx = (g.time * 400 + i * 130) % (W + 200) - 100;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - 60 - g.speed * 0.05, sy);
        ctx.stroke();
      }
    }

    // Ground scroll
    const gOff = (g.distance * 1.2) % 64;
    ctx.fillStyle = "rgba(212,175,55,0.07)";
    for (let x = -gOff; x < W; x += 32) {
      ctx.fillRect(x, GROUND + 8, 16, 4);
    }
    const off = (g.distance * 0.8) % 48;
    ctx.strokeStyle = "rgba(212,175,55,0.12)";
    for (let x = -off; x < W; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND);
      ctx.lineTo(x - 36, H);
      ctx.stroke();
    }
    ctx.fillStyle = GOLD;
    ctx.fillRect(0, GROUND, W, 4);
    ctx.fillStyle = "rgba(200,16,46,0.15)";
    ctx.fillRect(0, GROUND + 4, W, 2);
    ctx.fillStyle = "rgba(212,175,55,0.1)";
    ctx.fillRect(0, GROUND + 6, W, H - GROUND);

    for (const p of g.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    for (const e of g.entities) {
      if (e.collected) continue;
      if (e.spin) e.spin += 0.08;
      const cx = e.x + e.w / 2;
      const cy = e.y + e.h / 2;
      ctx.save();
      if (e.kind === "coin") {
        ctx.translate(cx, cy);
        if (e.spin) ctx.rotate(e.spin);
        const coin = sprites.current.coin;
        if (coin) ctx.drawImage(coin, -e.w / 2, -e.h / 2, e.w, e.h);
        else {
          ctx.fillStyle = GOLD;
          ctx.beginPath();
          ctx.arc(0, 0, e.w / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (e.kind === "solbag") {
        const bag = sprites.current.solbag;
        if (bag) ctx.drawImage(bag, e.x, e.y, e.w, e.h);
        else { ctx.font = `${e.h}px sans-serif`; ctx.textAlign = "center"; ctx.fillText("💰", cx, cy); }
      } else if (e.kind === "paperhand" || e.kind === "beartrap") {
        // Ground telegraph
        ctx.fillStyle = "rgba(255,46,46,0.18)";
        ctx.beginPath();
        ctx.ellipse(cx, GROUND + 2, e.w * 0.55, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        const sp = e.kind === "paperhand" ? sprites.current.paperhand : sprites.current.beartrap;
        if (sp) ctx.drawImage(sp, e.x, e.y, e.w, e.h);
        else { ctx.font = `${e.h}px sans-serif`; ctx.textAlign = "center"; ctx.fillText(e.kind === "paperhand" ? "🧻" : "🐻", cx, cy); }
      } else if (e.kind === "shield" || e.kind === "magnet") {
        ctx.translate(cx, cy);
        ctx.rotate(g.time * 2);
        ctx.strokeStyle = e.kind === "shield" ? "#6ec8ff" : GOLD_BRIGHT;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, e.w / 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = "20px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(e.kind === "shield" ? "🛡" : "🧲", 0, 6);
      }
      ctx.restore();
    }

    const grounded = g.bullY >= GROUND - BULL_SIZE - 0.5;
    let drawY = g.bullY;
    if (grounded && g.phase === "running") drawY += Math.sin(g.time * 16) * 2.5;

    const tilt = Math.max(-0.35, Math.min(0.45, g.bullVy / 1200));
    const bullImg = sprites.current.bull;
    const bx = BULL_X + BULL_SIZE / 2;
    const by = drawY + BULL_SIZE / 2;

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(tilt);
    if (g.invulnT > 0 && Math.floor(g.time * 20) % 2 === 0) ctx.globalAlpha = 0.55;
    if (g.magnetT > 0) {
      ctx.strokeStyle = `rgba(237,203,106,${0.4 + Math.sin(g.time * 12) * 0.2})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, BULL_SIZE * 0.72, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (g.shield > 0) {
      ctx.strokeStyle = "rgba(110,200,255,0.85)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, BULL_SIZE * 0.62, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (bullImg) {
      ctx.drawImage(bullImg, -BULL_SIZE / 2, -BULL_SIZE / 2, BULL_SIZE, BULL_SIZE);
    } else {
      ctx.rotate(-tilt);
      drawBull(ctx, BULL_X, drawY, BULL_SIZE, "gold");
    }
    ctx.restore();

    ctx.textAlign = "center";
    for (const p of g.popups) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y - (1 - p.life) * 50);
      ctx.scale(p.scale, p.scale);
      ctx.fillStyle = GOLD_BRIGHT;
      ctx.font = "900 20px Impact, sans-serif";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 3;
      ctx.strokeText(p.text, 0, 0);
      ctx.fillText(p.text, 0, 0);
      ctx.restore();
    }

    // HUD bar
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, W, 52);
    ctx.textAlign = "left";
    ctx.fillStyle = BONE;
    ctx.font = "700 16px monospace";
    ctx.fillText(`${calcScore(g)}`, 16, 22);
    ctx.font = "600 11px monospace";
    ctx.fillStyle = "#9A95A3";
    ctx.fillText("SCORE", 16, 36);
    ctx.fillStyle = GOLD;
    ctx.fillText(`◉ ${g.coins}`, 120, 22);
    ctx.fillStyle = "#9A95A3";
    ctx.fillText(`${g.time.toFixed(1)}s`, 120, 36);
    if (g.combo >= 2) {
      ctx.fillStyle = CRIMSON_BRIGHT;
      ctx.font = "900 14px Impact, sans-serif";
      ctx.fillText(`x${Math.min(g.combo, 8)} COMBO`, 220, 28);
    }
    if (g.shield > 0) {
      ctx.textAlign = "right";
      ctx.fillStyle = "#6ec8ff";
      ctx.font = "700 13px monospace";
      ctx.fillText(`🛡${g.shield}`, W - 16, 22);
    }
    if (g.magnetT > 0) {
      ctx.fillStyle = GOLD_BRIGHT;
      ctx.fillText(`🧲${g.magnetT.toFixed(1)}s`, W - 16, 38);
    }
  }, []);

  const tryJump = (g: GameState) => {
    const grounded = g.bullY >= GROUND - BULL_SIZE - 1;
    const canCoyote = g.coyoteT > 0;
    if ((grounded || canCoyote) && g.jumpsLeft > 0) {
      g.bullVy = JUMP_V;
      g.jumpsLeft -= 1;
      g.coyoteT = 0;
      g.jumpBuffered = false;
      g.bufferT = 0;
      g.jumpCutApplied = false;
      burst(g, BULL_X + BULL_SIZE / 2, g.bullY + BULL_SIZE, "rgba(212,175,55,0.6)", 5);
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);
      return true;
    }
    return false;
  };

  const spawnPattern = (g: GameState) => {
    const t = g.time;
    const r = Math.random();
    const canObstacle = g.sinceObstacle > 1.1;

    const minGap = t < 15 ? 2.4 : t < 35 ? 1.85 : 1.45;
    if (!canObstacle || t < WARMUP_S || g.sinceObstacle < minGap) {
      const y = GROUND - 95 - Math.random() * 50;
      for (let i = 0; i < 3; i++) {
        g.entities.push({ x: W + 60 + i * 42, y: y - Math.sin(i * 1.2) * 18, w: 30, h: 30, kind: "coin", spin: Math.random() * Math.PI });
      }
      return;
    }

    const spawnX = W + 70;

    if (r < 0.3 && canObstacle) {
      g.entities.push({ x: spawnX, y: GROUND - 46, w: 40, h: 40, kind: "paperhand" });
      g.sinceObstacle = 0;
      if (Math.random() < 0.7) {
        g.entities.push({ x: spawnX + 130, y: GROUND - 125, w: 28, h: 28, kind: "coin", spin: 0 });
      }
    } else if (r < 0.48 && canObstacle) {
      g.entities.push({ x: spawnX, y: GROUND - 34, w: 46, h: 32, kind: "beartrap" });
      g.sinceObstacle = 0;
    } else if (r < 0.78) {
      const y = GROUND - 105 - Math.random() * 70;
      const n = t > 25 ? 4 : 3;
      for (let i = 0; i < n; i++) {
        g.entities.push({ x: spawnX + i * 40, y: y - Math.sin(i * 0.9) * 20, w: 30, h: 30, kind: "coin", spin: i * 0.5 });
      }
    } else if (r < 0.86) {
      g.entities.push({ x: spawnX, y: GROUND - 168, w: 36, h: 36, kind: "solbag" });
    } else if (r < 0.93) {
      g.entities.push({ x: spawnX, y: GROUND - 125, w: 34, h: 34, kind: "shield" });
    } else {
      g.entities.push({ x: spawnX, y: GROUND - 148, w: 34, h: 34, kind: "magnet" });
    }
  };

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
      setTimeout(() => setShake(false), 500);
      burst(g, BULL_X + BULL_SIZE / 2, g.bullY + BULL_SIZE / 2, CRIMSON, 16);
      g.flashT = 0.25;
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([30, 40, 60]);

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
        }
      }
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) drawFrame(g, ctx);
    },
    [address, earn, grantBonus, drawFrame]
  );

  const collectCoin = (g: GameState, e: Entity, mult: number) => {
    e.collected = true;
    g.coins += 1;
    g.comboTimer = 1.6;
    g.combo = Math.min(10, g.combo + 1);
    const pts = 100 * mult;
    g.bonus += pts - 100;
    g.popups.push({ x: e.x + e.w / 2, y: e.y, text: mult > 1 ? `+${pts}` : "+100", life: 1, scale: 1 + mult * 0.05 });
    burst(g, e.x + e.w / 2, e.y + e.h / 2, GOLD_BRIGHT, 6);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(4);
  };

  const loop = useCallback(
    (now: number) => {
      const g = game.current;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const dt = Math.min(0.033, (now - g.last) / 1000 || 0.016);
      g.last = now;

      if (g.phase === "countdown") {
        g.countdown -= dt;
        setCountdownN(Math.ceil(Math.max(0, g.countdown)));
        if (g.countdown <= 0) {
          g.phase = "running";
          g.last = now;
          setPhase("running");
          setCountdownN(0);
        }
        drawFrame(g, ctx);
        g.raf = requestAnimationFrame(loop);
        return;
      }

      if (g.phase !== "running") return;

      g.time += dt;
      g.sinceObstacle += dt;
      if (g.comboTimer > 0) g.comboTimer -= dt;
      else g.combo = 0;
      if (g.magnetT > 0) g.magnetT -= dt;
      if (g.invulnT > 0) g.invulnT -= dt;
      if (g.flashT > 0) g.flashT -= dt * 2;

      // Gentler ramp: crawl first 18s, then climb
      const ramp =
        g.time < 18 ? g.time * 5.5 : g.time < 40 ? 99 + (g.time - 18) * 6 : 231 + (g.time - 40) * 4;
      g.speed = Math.min(MAX_SPEED, BASE_SPEED + ramp);
      g.distance += g.speed * dt * 0.09;

      // Jump buffer — retry each frame until window closes
      if (g.jumpBuffered) {
        g.bufferT -= dt;
        if (tryJump(g) || g.bufferT <= 0) g.jumpBuffered = false;
      }

      g.bullVy += GRAVITY * dt;

      g.bullY += g.bullVy * dt;
      const grounded = g.bullY >= GROUND - BULL_SIZE;
      if (grounded) {
        if (g.bullY > GROUND - BULL_SIZE) {
          g.bullY = GROUND - BULL_SIZE;
          if (g.bullVy > 400) burst(g, BULL_X + BULL_SIZE / 2, GROUND, "rgba(212,175,55,0.35)", 4);
        }
        g.bullVy = 0;
        g.jumpsLeft = 2;
        g.coyoteT = COYOTE_S;
      } else {
        g.coyoteT = Math.max(0, g.coyoteT - dt);
      }

      g.spawnIn -= dt;
      if (g.spawnIn <= 0) {
        spawnPattern(g);
        g.spawnIn = Math.max(0.65, 1.5 - g.time * 0.008) * (0.75 + Math.random() * 0.45);
      }

      const bull = hurtbox(g);
      const mult = Math.max(1, g.combo);

      if (g.magnetT > 0) {
        for (const e of g.entities) {
          if (e.collected || e.kind !== "coin") continue;
          const dx = bull.x + bull.w / 2 - (e.x + e.w / 2);
          const dy = bull.y + bull.h / 2 - (e.y + e.h / 2);
          const dist = Math.hypot(dx, dy);
          if (dist < 200 && dist > 2) {
            e.x += (dx / dist) * 500 * dt;
            e.y += (dy / dist) * 500 * dt;
          }
        }
      }

      for (const e of g.entities) {
        e.x -= g.speed * dt;
        if (e.collected) continue;
        if (!collectHit(bull, e)) continue;

        if (e.kind === "coin") collectCoin(g, e, mult);
        else if (e.kind === "solbag") {
          e.collected = true;
          g.coins += 5;
          g.bonus += 400;
          g.popups.push({ x: e.x + e.w / 2, y: e.y, text: "+500!", life: 1, scale: 1.2 });
          burst(g, e.x + e.w / 2, e.y + e.h / 2, GOLD, 10);
        } else if (e.kind === "shield") {
          e.collected = true;
          g.shield = Math.min(2, g.shield + 1);
          g.popups.push({ x: e.x + e.w / 2, y: e.y, text: "SHIELD", life: 1, scale: 1.1 });
        } else if (e.kind === "magnet") {
          e.collected = true;
          g.magnetT = 5.5;
          g.popups.push({ x: e.x + e.w / 2, y: e.y, text: "MAGNET", life: 1, scale: 1.1 });
        } else if (g.invulnT > 0) {
          e.collected = true;
        } else if (g.shield > 0) {
          g.shield--;
          g.invulnT = 1.4;
          g.flashT = 0.15;
          e.x = -999;
          g.popups.push({ x: bull.x, y: bull.y, text: "BLOCKED", life: 1, scale: 1 });
          burst(g, bull.x + bull.w / 2, bull.y + bull.h / 2, "#6ec8ff", 8);
        } else {
          g.deathReason = e.kind === "paperhand" ? "Paper hands got you" : "Bear trap snapped";
          endRun(g);
          return;
        }
      }

      g.entities = g.entities.filter((e) => e.x > -100 && !e.collected);
      for (const p of g.popups) {
        p.life -= dt * 1.2;
        p.scale = 1 + (1 - p.life) * 0.15;
      }
      g.popups = g.popups.filter((p) => p.life > 0);
      for (const p of g.particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 400 * dt;
        p.life -= dt * 1.8;
      }
      g.particles = g.particles.filter((p) => p.life > 0);

      drawFrame(g, ctx);
      g.raf = requestAnimationFrame(loop);
    },
    [drawFrame, endRun]
  );

  const beginCountdown = useCallback(() => {
    const g = game.current;
    cancelAnimationFrame(g.raf);
    Object.assign(g, freshState(), {
      phase: "countdown",
      countdown: 3.2,
      last: performance.now(),
    });
    setPhase("countdown");
    setCountdownN(3);
    setScore(0);
    setHpEarned(0);
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

  const jumpDown = useCallback(() => {
    const g = game.current;
    if (g.phase !== "running" && g.phase !== "countdown") return;
    g.jumpHeld = true;
    if (!tryJump(g)) {
      g.jumpBuffered = true;
      g.bufferT = BUFFER_S;
    }
  }, []);

  const jumpUp = useCallback(() => {
    const g = game.current;
    if (g.jumpHeld && g.bullVy < -200 && !g.jumpCutApplied) {
      g.bullVy *= JUMP_CUT;
      g.jumpCutApplied = true;
    }
    g.jumpHeld = false;
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect || rect.top >= window.innerHeight || rect.bottom <= 0) return;
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (phase === "idle" || phase === "over") beginCountdown();
        else jumpDown();
      }
      if (e.code === "KeyP") togglePause();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") jumpUp();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) drawFrame(game.current, ctx);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      cancelAnimationFrame(game.current.raf);
    };
  }, [phase, beginCountdown, jumpDown, jumpUp, togglePause, drawFrame]);

  function doSubmit() {
    if (!address || submitted) return;
    onLeaderboard(submitScore({ name: shortAddress(address), score, game: "charge" }));
    setSubmitted(true);
    fireConfetti({ count: 90 });
  }

  return (
    <div>
      <div
        ref={wrapRef}
        className={cn("relative overflow-hidden border-2 border-gold/30 bg-black horn-clip", shake && "animate-[shake_0.4s_ease-in-out]")}
      >
        <canvas ref={canvasRef} className="block w-full touch-none select-none" />

        <AnimatePresence>
          {phase === "countdown" && countdownN > 0 && (
            <motion.div
              key={countdownN}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.4, opacity: 0 }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <span className="font-display text-8xl text-gold drop-shadow-[0_0_40px_rgba(212,175,55,0.8)]">
                {countdownN}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-void/80 px-4">
            <p className="font-display text-3xl uppercase tracking-widest text-gold-shimmer">Charge</p>
            <p className="max-w-sm text-center text-sm text-ash">
              5s warm-up · double jump · hold JUMP for big hops, release early for short ones. Space or ▲ JUMP.
            </p>
            <Button size="lg" onClick={beginCountdown}><Play size={18} /> Start Run</Button>
          </div>
        )}
        {phase === "paused" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-void/80">
            <p className="font-display text-2xl uppercase text-bone">Paused</p>
            <Button onClick={togglePause}><Play size={15} /> Resume</Button>
          </div>
        )}
        {phase === "over" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-void/90 px-4 text-center">
            <p className="font-display text-xl uppercase text-crimson-bright">Rekt!</p>
            {game.current.deathReason && (
              <p className="font-mono text-xs text-crimson-bright/80">{game.current.deathReason}</p>
            )}
            <p className="font-display text-5xl text-gold">{score.toLocaleString()}</p>
            <p className="font-mono text-xs text-ash">{coins} coins · best {Math.max(highScore, score).toLocaleString()}</p>
            {hpEarned > 0 && <p className="mt-1 border border-gold/50 bg-gold/10 px-4 py-1.5 font-display text-sm text-gold">+{hpEarned} HP</p>}
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Button onClick={beginCountdown}><RotateCcw size={14} /> Again</Button>
              <Button variant="crimson" onClick={() => shareOnX(`Scored ${score} in CHARGE 🐂 — ansem.space`)}>
                <Share2 size={14} /> Share
              </Button>
              {address ? (
                <Button variant="outline" onClick={doSubmit} disabled={submitted}>
                  <Trophy size={14} /> {submitted ? "✓" : "Submit"}
                </Button>
              ) : (
                <Button variant="outline" onClick={connect}>Connect</Button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Dedicated jump control — no more full-screen accidental taps */}
      <button
        type="button"
        disabled={phase === "idle" || phase === "over"}
        onPointerDown={(e) => { e.preventDefault(); jumpDown(); }}
        onPointerUp={jumpUp}
        onPointerLeave={jumpUp}
        className={cn(
          "mt-3 w-full border-2 py-5 font-display text-lg uppercase tracking-[0.35em] transition-all select-none touch-manipulation horn-clip-sm",
          phase === "running" || phase === "countdown"
            ? "border-gold bg-gold/15 text-gold active:scale-[0.98] active:bg-gold/30 active:shadow-gold-glow"
            : "border-edge bg-panel text-ash/40"
        )}
      >
        {phase === "running" || phase === "countdown" ? "▲ JUMP" : "Start a run to jump"}
      </button>

      <div className="mt-3 flex flex-wrap gap-2">
        {(phase === "running" || phase === "paused") && (
          <Button size="sm" variant="outline" onClick={togglePause}>
            {phase === "paused" ? <Play size={14} /> : <Pause size={14} />}
            {phase === "paused" ? "Resume" : "Pause"}
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={beginCountdown}><RotateCcw size={14} /> Restart</Button>
        <span className="ml-auto font-mono text-xs text-ash">Best <span className="text-gold">{highScore.toLocaleString()}</span></span>
      </div>

      <div className={cn("mt-3 flex items-center justify-between gap-4 border px-4 py-3 horn-clip-sm", dailyDone ? "border-gold/50 bg-gold/10" : "border-edge bg-panel")}>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-crimson">Daily challenge</p>
          <p className="mt-0.5 text-sm text-bone">{daily.current.label}</p>
        </div>
        <span className={cn("text-xs uppercase", dailyDone ? "text-gold" : "text-ash")}>{dailyDone ? "✓ +50 HP" : "—"}</span>
      </div>
    </div>
  );
}