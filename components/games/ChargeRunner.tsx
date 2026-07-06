"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play, RotateCcw, Share2, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/components/WalletProvider";
import { useHerd } from "@/components/HerdProvider";
import { drawBull } from "@/lib/bull";
import { slotUrl } from "@/lib/asset-manifest";
import { sfx } from "@/lib/arcade-audio";
import { LS, shareOnX } from "@/lib/constants";
import { loadHighs, saveHigh, submitScore, type ArcadeScore } from "@/lib/games";
import { BONE, CRIMSON_BRIGHT, GOLD, GOLD_BRIGHT, GREEN, VOID } from "@/lib/palette";
import { fireConfetti } from "@/lib/confetti";
import { claimDailyChallenge } from "@/lib/quests";
import { cn, shortAddress, store } from "@/lib/utils";

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
const MAX_SPEED = 480;
const BASE_SPEED = 240;
const WARMUP_S = 4;

type Phase = "idle" | "countdown" | "running" | "paused" | "over";
type EntityKind =
  | "paperhand"
  | "beartrap"
  | "coin"
  | "solbag"
  | "shield"
  | "magnet"
  | "dip"
  | "pump"
  | "whale"
  | "flybear";

type MarketZone = "warmup" | "bull" | "meme" | "bear";

interface Entity {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: EntityKind;
  collected?: boolean;
  spin?: number;
  nearMissed?: boolean;
  passed?: boolean;
  bob?: number;
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
  color?: string;
}

interface Star {
  x: number;
  y: number;
  s: number;
  tw: number;
}

interface GameState {
  phase: Phase;
  popups: Popup[];
  particles: Particle[];
  stars: Star[];
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
  boostT: number;
  entities: Entity[];
  spawnIn: number;
  time: number;
  sinceObstacle: number;
  countdown: number;
  flashT: number;
  shakeT: number;
  zoneBanner: string;
  zoneBannerT: number;
  nearMisses: number;
  runFrame: number;
  milestones: number;
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

const ZONE_META: Record<MarketZone, { label: string; sky: [string, string, string]; tint: string }> = {
  warmup: { label: "WARM UP", sky: ["#050508", VOID, "#1a1220"], tint: "rgba(212,175,55,0)" },
  bull: { label: "BULL RUN", sky: ["#0a0810", "#120f1a", "#1e1528"], tint: "rgba(212,175,55,0.08)" },
  meme: { label: "MEME SEASON", sky: ["#0f0818", "#1a0f28", "#281838"], tint: "rgba(180,100,255,0.1)" },
  bear: { label: "BEAR MARKET", sky: ["#080a12", "#101828", "#1a2030"], tint: "rgba(200,16,46,0.12)" },
};

function getZone(t: number): MarketZone {
  if (t < WARMUP_S) return "warmup";
  if (t < 22) return "bull";
  if (t < 48) return "meme";
  return "bear";
}

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
  const boost = g.boostT > 0 ? 1.35 : 1;
  return Math.floor((g.distance + g.coins * 100 + g.bonus + g.nearMisses * 25) * boost);
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

function dustKick(g: GameState) {
  for (let i = 0; i < 4; i++) {
    g.particles.push({
      x: BULL_X + 10 + Math.random() * 20,
      y: GROUND - 4,
      vx: -60 - Math.random() * 80,
      vy: -30 - Math.random() * 40,
      life: 0.25 + Math.random() * 0.15,
      color: "rgba(212,175,55,0.45)",
      size: 2 + Math.random() * 2,
    });
  }
}

function makeStars(): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < 48; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * GROUND * 0.65, s: 0.5 + Math.random() * 1.5, tw: Math.random() * Math.PI * 2 });
  }
  return stars;
}

function freshState(): GameState {
  return {
    phase: "idle",
    popups: [],
    particles: [],
    stars: makeStars(),
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
    boostT: 0,
    entities: [],
    spawnIn: 1.8,
    time: 0,
    sinceObstacle: 99,
    countdown: 3,
    flashT: 0,
    shakeT: 0,
    zoneBanner: "",
    zoneBannerT: 0,
    nearMisses: 0,
    runFrame: 0,
    milestones: 0,
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
  const [liveCombo, setLiveCombo] = useState(0);
  const [liveZone, setLiveZone] = useState<MarketZone>("warmup");
  const [liveBoost, setLiveBoost] = useState(false);

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
    const pad =
      e.kind === "coin" || e.kind === "solbag" || e.kind === "shield" || e.kind === "magnet" || e.kind === "pump"
        ? 1.55
        : e.kind === "whale"
          ? 0.75
          : 0.82;
    const dx = Math.abs(cx - bx);
    const dy = Math.abs(cy - by);
    return dx < bull.w / 2 + (e.w / 2) * pad && dy < bull.h / 2 + (e.h / 2) * pad;
  };

  const drawFrame = useCallback((g: GameState, ctx: CanvasRenderingContext2D) => {
    const zone = getZone(g.time);
    const meta = ZONE_META[zone];
    const shakeX = g.shakeT > 0 ? (Math.random() - 0.5) * g.shakeT * 14 : 0;
    const shakeY = g.shakeT > 0 ? (Math.random() - 0.5) * g.shakeT * 8 : 0;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    if (g.flashT > 0) {
      ctx.fillStyle = `rgba(255,255,255,${g.flashT * 0.35})`;
      ctx.fillRect(-10, -10, W + 20, H + 20);
    }

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, meta.sky[0]);
    sky.addColorStop(0.55, meta.sky[1]);
    sky.addColorStop(1, meta.sky[2]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = meta.tint;
    ctx.fillRect(0, 0, W, H);

    // Stars
    for (const s of g.stars) {
      const a = 0.25 + Math.sin(g.time * 3 + s.tw) * 0.2;
      ctx.fillStyle = `rgba(242,239,233,${a * s.s})`;
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }

    // Moon
    ctx.fillStyle = "rgba(237,203,106,0.12)";
    ctx.beginPath();
    ctx.arc(W - 120, 70, 36, 0, Math.PI * 2);
    ctx.fill();

    // Parallax skyline
    for (let layer = 0; layer < 3; layer++) {
      const parallax = 0.06 + layer * 0.05;
      const alpha = 0.04 + layer * 0.03;
      ctx.fillStyle = `rgba(212,175,55,${alpha})`;
      for (let i = 0; i < 10; i++) {
        const bw = 40 + (i % 4) * 22;
        const bh = 28 + (i % 5) * 16 + layer * 12;
        const px = ((i * 110 - g.distance * parallax) % (W + 120)) - 60;
        ctx.fillRect(px, GROUND - bh, bw, bh);
        if (layer === 2 && i % 2 === 0) {
          ctx.fillStyle = `rgba(255,220,120,${0.15 + Math.sin(g.time * 2 + i) * 0.08})`;
          ctx.fillRect(px + 8, GROUND - bh + 10, 8, 10);
          ctx.fillStyle = `rgba(212,175,55,${alpha})`;
        }
      }
    }

    if (g.speed > 340) {
      ctx.strokeStyle = `rgba(212,175,55,${Math.min(0.3, (g.speed - 340) / 500)})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const sy = 35 + i * 48;
        const sx = (g.time * 450 + i * 110) % (W + 200) - 100;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - 70 - g.speed * 0.06, sy);
        ctx.stroke();
      }
    }

    const gOff = (g.distance * 1.2) % 64;
    ctx.fillStyle = "rgba(212,175,55,0.07)";
    for (let x = -gOff; x < W; x += 32) ctx.fillRect(x, GROUND + 8, 16, 4);

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
      if (e.bob !== undefined) e.bob += 0.06;
      const bobY = e.bob !== undefined ? Math.sin(e.bob) * 6 : 0;
      const cx = e.x + e.w / 2;
      const cy = e.y + e.h / 2 + bobY;
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
        if (bag) ctx.drawImage(bag, e.x, e.y + bobY, e.w, e.h);
        else { ctx.font = `${e.h}px sans-serif`; ctx.textAlign = "center"; ctx.fillText("💰", cx, cy); }
      } else if (e.kind === "dip") {
        const body = e.h * 0.7;
        ctx.fillStyle = CRIMSON_BRIGHT;
        ctx.fillRect(e.x + e.w * 0.35, e.y + bobY, e.w * 0.3, body);
        ctx.fillStyle = GREEN;
        ctx.fillRect(e.x, e.y + bobY + body * 0.3, e.w * 0.35, body * 0.7);
        ctx.font = "9px monospace";
        ctx.fillStyle = BONE;
        ctx.textAlign = "center";
        ctx.fillText("DIP", cx, e.y + bobY - 6);
      } else if (e.kind === "pump") {
        ctx.translate(cx, cy + bobY);
        ctx.rotate(g.time * 3);
        ctx.fillStyle = GREEN;
        ctx.fillRect(-e.w / 2, -e.h / 2, e.w, e.h * 0.6);
        ctx.font = "18px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🚀", 0, 8);
      } else if (e.kind === "whale") {
        ctx.fillStyle = "rgba(110,200,255,0.15)";
        ctx.beginPath();
        ctx.ellipse(cx, GROUND + 2, e.w * 0.6, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = `${e.h}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("🐋", cx, cy);
        ctx.font = "9px monospace";
        ctx.fillStyle = "#6ec8ff";
        ctx.fillText("WHALE", cx, e.y + bobY - 8);
      } else if (e.kind === "flybear") {
        ctx.translate(cx, cy + bobY);
        ctx.rotate(Math.sin(g.time * 4) * 0.15);
        const sp = sprites.current.beartrap;
        if (sp) ctx.drawImage(sp, -e.w / 2, -e.h / 2, e.w, e.h);
        else { ctx.font = `${e.h}px sans-serif`; ctx.textAlign = "center"; ctx.fillText("🐻", 0, 6); }
      } else if (e.kind === "paperhand" || e.kind === "beartrap") {
        ctx.fillStyle = "rgba(255,46,46,0.18)";
        ctx.beginPath();
        ctx.ellipse(cx, GROUND + 2, e.w * 0.55, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        const sp = e.kind === "paperhand" ? sprites.current.paperhand : sprites.current.beartrap;
        if (sp) ctx.drawImage(sp, e.x, e.y, e.w, e.h);
        else { ctx.font = `${e.h}px sans-serif`; ctx.textAlign = "center"; ctx.fillText(e.kind === "paperhand" ? "🧻" : "🐻", cx, cy); }
      } else if (e.kind === "shield" || e.kind === "magnet") {
        ctx.translate(cx, cy + bobY);
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
    if (grounded && g.phase === "running") {
      drawY += Math.sin(g.runFrame) * 3;
      g.runFrame += 0.35;
    }

    // Bull shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    const shadowW = BULL_SIZE * (grounded ? 0.55 : 0.35);
    ctx.ellipse(BULL_X + BULL_SIZE / 2, GROUND + 6, shadowW, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    const tilt = Math.max(-0.35, Math.min(0.45, g.bullVy / 1200));
    const bullImg = sprites.current.bull;
    const bx = BULL_X + BULL_SIZE / 2;
    const by = drawY + BULL_SIZE / 2;

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(tilt);
    if (g.invulnT > 0 && Math.floor(g.time * 20) % 2 === 0) ctx.globalAlpha = 0.55;
    if (g.boostT > 0) {
      ctx.strokeStyle = `rgba(22,199,132,${0.5 + Math.sin(g.time * 14) * 0.3})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, BULL_SIZE * 0.8, 0, Math.PI * 2);
      ctx.stroke();
    }
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
      ctx.fillStyle = p.color ?? GOLD_BRIGHT;
      ctx.font = "900 20px Impact, sans-serif";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 3;
      ctx.strokeText(p.text, 0, 0);
      ctx.fillText(p.text, 0, 0);
      ctx.restore();
    }

    // Zone banner
    if (g.zoneBannerT > 0) {
      ctx.globalAlpha = Math.min(1, g.zoneBannerT);
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(W / 2 - 160, H / 2 - 36, 320, 52);
      ctx.font = "900 22px Impact, sans-serif";
      ctx.fillStyle = zone === "bear" ? CRIMSON_BRIGHT : GOLD_BRIGHT;
      ctx.fillText(g.zoneBanner, W / 2, H / 2);
      ctx.globalAlpha = 1;
    }

    // HUD
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, W, 56);
    ctx.textAlign = "left";
    ctx.fillStyle = BONE;
    ctx.font = "700 17px monospace";
    ctx.fillText(`${calcScore(g)}`, 16, 22);
    ctx.font = "600 10px monospace";
    ctx.fillStyle = "#9A95A3";
    ctx.fillText("SCORE", 16, 36);
    ctx.fillStyle = GOLD;
    ctx.fillText(`◉ ${g.coins}`, 110, 22);
    ctx.fillStyle = "#9A95A3";
    ctx.fillText(`${g.time.toFixed(1)}s`, 110, 36);
    ctx.fillStyle = zone === "bear" ? CRIMSON_BRIGHT : GOLD;
    ctx.font = "700 10px monospace";
    ctx.fillText(meta.label, 110, 48);

    if (g.combo >= 2) {
      const comboW = Math.min(120, g.comboTimer * 75);
      ctx.fillStyle = "rgba(200,16,46,0.25)";
      ctx.fillRect(200, 38, 120, 6);
      ctx.fillStyle = CRIMSON_BRIGHT;
      ctx.fillRect(200, 38, comboW, 6);
      ctx.font = "900 14px Impact, sans-serif";
      ctx.fillText(`x${Math.min(g.combo, 10)} COMBO`, 200, 28);
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
    if (g.boostT > 0) {
      ctx.fillStyle = GREEN;
      ctx.fillText(`🚀${g.boostT.toFixed(1)}s`, W - 16, 52);
    }

    ctx.restore();
  }, []);

  const banner = (g: GameState, text: string) => {
    g.zoneBanner = text;
    g.zoneBannerT = 2.2;
    sfx.milestone();
  };

  const checkMilestones = (g: GameState) => {
    const marks = [15, 30, 45, 60, 90];
    const labels = ["DIAMOND HANDS UNLOCKED", "MEME SEASON LIVE", "BEAR MARKET INCOMING", "LEGENDARY RUN", "UNSTOPPABLE"];
    for (let i = 0; i < marks.length; i++) {
      const bit = 1 << i;
      if (g.time >= marks[i] && !(g.milestones & bit)) {
        g.milestones |= bit;
        g.bonus += 150 * (i + 1);
        banner(g, labels[i]);
        burst(g, W / 2, H / 2, GOLD_BRIGHT, 14);
      }
    }
    const z = getZone(g.time);
    const zBit = z === "bull" ? 256 : z === "meme" ? 512 : z === "bear" ? 1024 : 0;
    if (zBit && !(g.milestones & zBit)) {
      g.milestones |= zBit;
      banner(g, ZONE_META[z].label);
    }
  };

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
      sfx.jump();
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);
      return true;
    }
    return false;
  };

  const spawnPattern = (g: GameState) => {
    const t = g.time;
    const zone = getZone(t);
    const r = Math.random();
    const canObstacle = g.sinceObstacle > 1.1;
    const minGap = t < 15 ? 2.3 : t < 35 ? 1.8 : 1.4;

    if (!canObstacle || t < WARMUP_S || g.sinceObstacle < minGap) {
      const y = GROUND - 95 - Math.random() * 50;
      const n = 3 + (t > 20 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        g.entities.push({
          x: W + 60 + i * 42,
          y: y - Math.sin(i * 1.2) * 18,
          w: 30,
          h: 30,
          kind: "coin",
          spin: Math.random() * Math.PI,
        });
      }
      return;
    }

    const spawnX = W + 80;

    // Choreographed gate: obstacle + coin above
    if (r < 0.22 && canObstacle) {
      g.entities.push({ x: spawnX, y: GROUND - 44, w: 38, h: 38, kind: "paperhand" });
      g.entities.push({ x: spawnX + 20, y: GROUND - 145, w: 28, h: 28, kind: "coin", spin: 0 });
      g.sinceObstacle = 0;
    } else if (r < 0.36 && canObstacle && t > 12) {
      g.entities.push({ x: spawnX, y: GROUND - 52, w: 28, h: 70, kind: "dip", bob: 0 });
      g.sinceObstacle = 0;
    } else if (r < 0.48 && canObstacle) {
      g.entities.push({ x: spawnX, y: GROUND - 32, w: 44, h: 30, kind: "beartrap" });
      g.sinceObstacle = 0;
    } else if (r < 0.58 && t > 28 && canObstacle) {
      g.entities.push({ x: spawnX, y: GROUND - 130, w: 56, h: 56, kind: "flybear", bob: Math.random() * Math.PI });
      g.sinceObstacle = 0;
    } else if (r < 0.68 && t > 35 && canObstacle) {
      g.entities.push({ x: spawnX, y: GROUND - 90, w: 72, h: 72, kind: "whale", bob: 0 });
      g.sinceObstacle = 0;
    } else if (r < 0.82) {
      const y = GROUND - 100 - Math.random() * 75;
      const n = zone === "meme" ? 5 : 3;
      for (let i = 0; i < n; i++) {
        g.entities.push({
          x: spawnX + i * 38,
          y: y - Math.sin(i * 0.85) * 22,
          w: 30,
          h: 30,
          kind: "coin",
          spin: i * 0.5,
        });
      }
    } else if (r < 0.88) {
      g.entities.push({ x: spawnX, y: GROUND - 162, w: 36, h: 36, kind: "solbag", bob: 0 });
    } else if (r < 0.93 && zone !== "bear") {
      g.entities.push({ x: spawnX, y: GROUND - 128, w: 34, h: 34, kind: "pump", bob: 0 });
    } else if (r < 0.96) {
      g.entities.push({ x: spawnX, y: GROUND - 120, w: 34, h: 34, kind: "shield" });
    } else {
      g.entities.push({ x: spawnX, y: GROUND - 140, w: 34, h: 34, kind: "magnet" });
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
      setLiveCombo(0);
      setLiveBoost(false);
      setTimeout(() => setShake(false), 500);
      burst(g, BULL_X + BULL_SIZE / 2, g.bullY + BULL_SIZE / 2, CRIMSON_BRIGHT, 16);
      g.flashT = 0.25;
      g.shakeT = 1;
      sfx.hit();
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
    g.comboTimer = 1.8;
    g.combo = Math.min(12, g.combo + 1);
    const pts = 100 * mult;
    g.bonus += pts - 100;
    g.popups.push({
      x: e.x + e.w / 2,
      y: e.y,
      text: mult > 1 ? `+${pts}` : "+100",
      life: 1,
      scale: 1 + mult * 0.05,
    });
    burst(g, e.x + e.w / 2, e.y + e.h / 2, GOLD_BRIGHT, 6);
    if (g.combo >= 3) sfx.combo(g.combo);
    else sfx.coin();
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(4);
  };

  const checkPasses = (g: GameState, bull: ReturnType<typeof hurtbox>) => {
    for (const e of g.entities) {
      if (e.passed || e.collected) continue;
      if (e.x + e.w > bull.x - 8) continue;

      const danger = ["paperhand", "beartrap", "whale", "flybear", "dip"].includes(e.kind);
      if (danger && !e.nearMissed) {
        const close =
          Math.abs(e.y + e.h / 2 - (bull.y + bull.h / 2)) < e.h * 0.95 + 12;
        if (close) {
          e.nearMissed = true;
          g.nearMisses++;
          g.bonus += 75;
          g.popups.push({
            x: bull.x + bull.w / 2,
            y: bull.y,
            text: "CLOSE!",
            life: 0.9,
            scale: 1.1,
            color: "#6ec8ff",
          });
          sfx.nearMiss();
        }
      }

      if (e.kind === "dip" && !e.passed) {
        e.passed = true;
        g.bonus += 250;
        g.popups.push({
          x: e.x + e.w / 2,
          y: e.y,
          text: "BOUGHT THE DIP!",
          life: 1.2,
          scale: 1.15,
          color: GREEN,
        });
        burst(g, e.x + e.w / 2, e.y + e.h / 2, GREEN, 10);
        sfx.powerup();
      }
      e.passed = true;
    }
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
      if (g.boostT > 0) g.boostT -= dt;
      if (g.flashT > 0) g.flashT -= dt * 2;
      if (g.shakeT > 0) g.shakeT -= dt * 2.5;
      if (g.zoneBannerT > 0) g.zoneBannerT -= dt;

      checkMilestones(g);

      const ramp =
        g.time < 18 ? g.time * 5.5 : g.time < 40 ? 99 + (g.time - 18) * 6 : 231 + (g.time - 40) * 4;
      const boostSpd = g.boostT > 0 ? 80 : 0;
      g.speed = Math.min(MAX_SPEED + boostSpd, BASE_SPEED + ramp + boostSpd);
      g.distance += g.speed * dt * 0.09;

      if (g.jumpBuffered) {
        g.bufferT -= dt;
        if (tryJump(g) || g.bufferT <= 0) g.jumpBuffered = false;
      }

      const prevVy = g.bullVy;
      g.bullVy += GRAVITY * dt;
      g.bullY += g.bullVy * dt;
      const grounded = g.bullY >= GROUND - BULL_SIZE;
      if (grounded) {
        if (g.bullY > GROUND - BULL_SIZE) {
          g.bullY = GROUND - BULL_SIZE;
          if (prevVy > 500) {
            burst(g, BULL_X + BULL_SIZE / 2, GROUND, "rgba(212,175,55,0.35)", 5);
            g.shakeT = Math.max(g.shakeT, 0.35);
            sfx.land();
          }
          dustKick(g);
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
        g.spawnIn = Math.max(0.6, 1.45 - g.time * 0.007) * (0.75 + Math.random() * 0.45);
      }

      const bull = hurtbox(g);
      const mult = Math.max(1, g.combo);
      checkPasses(g, bull);

      if (g.magnetT > 0) {
        for (const e of g.entities) {
          if (e.collected || e.kind !== "coin") continue;
          const dx = bull.x + bull.w / 2 - (e.x + e.w / 2);
          const dy = bull.y + bull.h / 2 - (e.y + e.h / 2);
          const dist = Math.hypot(dx, dy);
          if (dist < 220 && dist > 2) {
            e.x += (dx / dist) * 520 * dt;
            e.y += (dy / dist) * 520 * dt;
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
          sfx.powerup();
        } else if (e.kind === "pump") {
          e.collected = true;
          g.boostT = 4.5;
          g.bonus += 200;
          g.popups.push({ x: e.x + e.w / 2, y: e.y, text: "PUMP!", life: 1, scale: 1.2, color: GREEN });
          burst(g, e.x + e.w / 2, e.y + e.h / 2, GREEN, 12);
          sfx.powerup();
        } else if (e.kind === "shield") {
          e.collected = true;
          g.shield = Math.min(2, g.shield + 1);
          g.popups.push({ x: e.x + e.w / 2, y: e.y, text: "SHIELD", life: 1, scale: 1.1 });
          sfx.powerup();
        } else if (e.kind === "magnet") {
          e.collected = true;
          g.magnetT = 5.5;
          g.popups.push({ x: e.x + e.w / 2, y: e.y, text: "MAGNET", life: 1, scale: 1.1 });
          sfx.powerup();
        } else if (g.invulnT > 0) {
          e.collected = true;
        } else if (g.shield > 0) {
          g.shield--;
          g.invulnT = 1.4;
          g.flashT = 0.15;
          e.x = -999;
          g.popups.push({ x: bull.x, y: bull.y, text: "BLOCKED", life: 1, scale: 1 });
          burst(g, bull.x + bull.w / 2, bull.y + bull.h / 2, "#6ec8ff", 8);
          sfx.powerup();
        } else {
          const reasons: Partial<Record<EntityKind, string>> = {
            paperhand: "Paper hands got you",
            beartrap: "Bear trap snapped",
            whale: "Whale body-blocked you",
            flybear: "Flying bear rekt you",
            dip: "You sold the dip",
          };
          g.deathReason = reasons[e.kind] ?? "Rekt";
          endRun(g);
          return;
        }
      }

      g.entities = g.entities.filter((e) => e.x > -120 && !e.collected);
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

      setLiveCombo(g.combo);
      setLiveZone(getZone(g.time));
      setLiveBoost(g.boostT > 0);

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
    setLiveCombo(0);
    setLiveZone("warmup");
    setLiveBoost(false);
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

  const zoneLabel = ZONE_META[liveZone].label;

  return (
    <div>
      <div
        ref={wrapRef}
        className={cn("relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-panel", shake && "animate-[shake_0.4s_ease-in-out]")}
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
            <p className="max-w-md text-center text-sm text-ash">
              Survive bull run → meme season → bear market. Dodge paper hands, buy the dip, grab pumps.
              Near-miss obstacles for bonus points. Space or ▲ JUMP.
            </p>
            <div className="flex flex-wrap justify-center gap-2 font-mono text-[10px] text-ash">
              <span className="border border-edge px-2 py-1">🧻 Paper hands</span>
              <span className="border border-edge px-2 py-1">📉 Buy the dip</span>
              <span className="border border-edge px-2 py-1">🚀 Pump boost</span>
              <span className="border border-edge px-2 py-1">🐋 Whale wall</span>
            </div>
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
            <p className="font-mono text-xs text-ash">
              {coins} coins · {game.current.nearMisses} near-misses · best {Math.max(highScore, score).toLocaleString()}
            </p>
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

        {(phase === "running" || phase === "paused") && (
          <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex items-center justify-between font-mono text-[10px]">
            <span className={cn("uppercase tracking-widest", liveZone === "bear" ? "text-crimson-bright" : "text-gold")}>
              {zoneLabel}
            </span>
            {liveCombo >= 2 && <span className="text-crimson-bright">x{liveCombo} combo</span>}
            {liveBoost && <span className="text-green-400">🚀 PUMP ACTIVE</span>}
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={phase === "idle" || phase === "over"}
        onPointerDown={(e) => { e.preventDefault(); jumpDown(); }}
        onPointerUp={jumpUp}
        onPointerLeave={jumpUp}
        className={cn(
          "mt-3 w-full rounded-2xl border py-5 font-display text-base font-semibold tracking-wide transition-all select-none touch-manipulation",
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

      <div className={cn("mt-3 flex items-center justify-between gap-4 rounded-2xl border px-4 py-3", dailyDone ? "border-gold/35 bg-gold/[0.06]" : "border-white/[0.06] bg-surface/80")}>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-crimson">Daily challenge</p>
          <p className="mt-0.5 text-sm text-bone">{daily.current.label}</p>
        </div>
        <span className={cn("text-xs uppercase", dailyDone ? "text-gold" : "text-ash")}>{dailyDone ? "✓ +50 HP" : "—"}</span>
      </div>
    </div>
  );
}