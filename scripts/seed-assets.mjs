/**
 * Generate premium default graphics for every asset slot and upload to Vercel Blob.
 * Run: node scripts/seed-assets.mjs
 * Requires BLOB_READ_WRITE_TOKEN in .env.local or environment.
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { put } from "@vercel/blob";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// Load .env.local
const envPath = resolve(root, ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m && !process.env[m[1].trim()]) {
      process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
if (!TOKEN) {
  console.error("Missing BLOB_READ_WRITE_TOKEN");
  process.exit(1);
}

const VOID = "#0A0A0A";
const PANEL = "#141317";
const GOLD = "#D4AF37";
const GOLD_BRIGHT = "#EDCB6A";
const CRIMSON = "#C8102E";
const CRIMSON_BRIGHT = "#FF2E2E";
const BONE = "#F2EFE9";

const BULL = {
  hornL: "M35 33 L14 25 L3 5 Q16 13 24 18 L38 27 Z",
  hornR: "M65 33 L86 25 L97 5 Q84 13 76 18 L62 27 Z",
  head: "M33 29 L67 29 L78 45 L71 72 L58 87 L50 95 L42 87 L29 72 L22 45 Z",
  eyeL: "M36 49 L46 53 L37 58 Z",
  eyeR: "M64 49 L54 53 L63 58 Z",
  blaze: "M50 33 L53 45 L50 66 L47 45 Z",
  nose: "M44 76 L50 80 L56 76 L50 84 Z",
};

function bullSvg(cx, cy, scale, glow = true) {
  const t = `translate(${cx - 50 * scale}, ${cy - 50 * scale}) scale(${scale})`;
  const glowFilter = glow
    ? `<filter id="glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`
    : "";
  const gf = glow ? ' filter="url(#glow)"' : "";
  return `${glowFilter}<g transform="${t}"${gf}>
    <path d="${BULL.hornL}" fill="${GOLD}"/>
    <path d="${BULL.hornR}" fill="${GOLD}"/>
    <path d="${BULL.head}" fill="${PANEL}" stroke="${GOLD}" stroke-width="2.5"/>
    <path d="${BULL.eyeL}" fill="${CRIMSON_BRIGHT}"/>
    <path d="${BULL.eyeR}" fill="${CRIMSON_BRIGHT}"/>
    <path d="${BULL.blaze}" fill="${GOLD_BRIGHT}"/>
    <path d="${BULL.nose}" fill="${GOLD}"/>
  </g>`;
}

function grid(w, h, opacity = 0.06) {
  return `<defs><pattern id="grid" width="56" height="56" patternUnits="userSpaceOnUse">
    <path d="M 56 0 L 0 0 0 56" fill="none" stroke="${GOLD}" stroke-width="0.5" opacity="${opacity}"/>
  </pattern></defs><rect width="${w}" height="${h}" fill="url(#grid)"/>`;
}

function radialBg(w, h) {
  return `<defs>
    <radialGradient id="rg" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.18"/>
      <stop offset="55%" stop-color="${CRIMSON}" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="${VOID}" stop-opacity="0"/>
    </radialGradient>
  </defs><rect width="${w}" height="${h}" fill="${VOID}"/><rect width="${w}" height="${h}" fill="url(#rg)"/>`;
}

function speedLines(w, h) {
  let lines = "";
  for (let i = 0; i < 30; i++) {
    const y = (h / 30) * i;
    const len = 60 + (i * 37) % 200;
    const x = w - ((i * 431) % (w * 0.6));
    lines += `<line x1="${x}" y1="${y}" x2="${x - len}" y2="${y}" stroke="${GOLD}" stroke-width="2" opacity="${0.08 + (i % 8) / 40}"/>`;
  }
  return lines;
}

function hornFrame(w, h, inset = 20) {
  return `<polygon points="${inset},0 ${w},0 ${w},${h - inset} ${w - inset},${h} 0,${h} 0,${inset}"
    fill="none" stroke="${GOLD}" stroke-width="3" opacity="0.55"/>`;
}

const GENERATORS = {
  "og-image": () => {
    const w = 1200, h = 630;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      ${radialBg(w, h)}${grid(w, h)}
      ${speedLines(w, h)}
      <rect x="0" y="0" width="8" height="${h}" fill="${CRIMSON}"/>
      <rect x="0" y="${h - 6}" width="${w}" height="6" fill="${GOLD}" opacity="0.7"/>
      ${bullSvg(920, 320, 4.2)}
      <text x="72" y="200" fill="${BONE}" font-family="Impact,Arial Black,sans-serif" font-size="82" font-weight="900" letter-spacing="6">ANSEM</text>
      <text x="72" y="280" fill="${GOLD}" font-family="Impact,Arial Black,sans-serif" font-size="82" font-weight="900" letter-spacing="8">SPACE</text>
      <text x="74" y="340" fill="${CRIMSON_BRIGHT}" font-family="monospace" font-size="28" letter-spacing="12">THE BLACK BULL</text>
      <text x="74" y="400" fill="${BONE}" font-family="monospace" font-size="22" opacity="0.75">Forge Memes · Charge Forward · Hold the Line</text>
      <text x="74" y="560" fill="${GOLD}" font-family="monospace" font-size="20" opacity="0.6">ansem.space</text>
    </svg>`;
  },

  favicon: () => {
    const s = 512;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
      <rect width="${s}" height="${s}" fill="${VOID}"/>
      <circle cx="256" cy="256" r="200" fill="${GOLD}" opacity="0.12"/>
      ${bullSvg(256, 270, 3.8, true)}
    </svg>`;
  },

  "logo-bull": () => {
    const s = 1024;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
      <rect width="${s}" height="${s}" fill="none"/>
      <circle cx="512" cy="512" r="420" fill="${GOLD}" opacity="0.08"/>
      <circle cx="512" cy="512" r="380" fill="none" stroke="${GOLD}" stroke-width="2" opacity="0.25" stroke-dasharray="12 8"/>
      ${bullSvg(512, 530, 7.5)}
    </svg>`;
  },

  "banner-x": () => {
    const w = 1500, h = 500;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      ${radialBg(w, h)}${grid(w, h, 0.04)}
      <rect x="0" y="0" width="${w}" height="4" fill="${GOLD}"/>
      <rect x="0" y="${h - 4}" width="${w}" height="4" fill="${CRIMSON}"/>
      ${bullSvg(1280, 260, 3.5)}
      <text x="80" y="200" fill="${BONE}" font-family="Impact,sans-serif" font-size="96" font-weight="900">ANSEM SPACE</text>
      <text x="82" y="290" fill="${GOLD}" font-family="monospace" font-size="32" letter-spacing="8">COMMUNITY HUB · $ANSEM · SOLANA</text>
      <text x="82" y="380" fill="${CRIMSON_BRIGHT}" font-family="monospace" font-size="26">THE BLACK BULL CHARGES</text>
    </svg>`;
  },

  "template-golden-charge": () => templateScene("GOLDEN CHARGE", GOLD, true),
  "template-red-candle-god": () => templateScene("RED CANDLE GOD", "#16C784", false, true),
  "template-moon-mission": () => templateScene("MOON MISSION", BONE, false, false, true),
  "template-paperhands-down": () => templateScene("PAPERHANDS DOWN", CRIMSON_BRIGHT, false, false, false, true),
  "template-blank-void": () => {
    const s = 1080;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
      <rect width="${s}" height="${s}" fill="${VOID}"/>
      ${hornFrame(s, s, 40)}
      ${bullSvg(540, 900, 2.2, false)}
      <text x="540" y="120" text-anchor="middle" fill="${GOLD}" font-family="monospace" font-size="28" opacity="0.5" letter-spacing="8">WRITE ANYTHING</text>
    </svg>`;
  },

  "sprite-bull-runner": () => spriteBull(),
  "sprite-paperhand": () => spriteEmoji("🧻", CRIMSON_BRIGHT, "PAPER"),
  "sprite-beartrap": () => spriteBear(),
  "sprite-coin": () => spriteCoin(),
  "sprite-solbag": () => spriteSolBag(),
  "story-card-bg": () => {
    const w = 1200, h = 675;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      ${radialBg(w, h)}
      ${grid(w, h, 0.03)}
      ${hornFrame(w, h, 28)}
      <rect x="28" y="28" width="${w - 56}" height="${h - 56}" fill="none" stroke="${GOLD}" stroke-width="2" opacity="0.3"/>
      ${bullSvg(180, 120, 1.8, false)}
      <text x="80" y="580" fill="${CRIMSON}" font-family="monospace" font-size="22" opacity="0.8">DIAMOND HANDS STORY</text>
      <text x="80" y="620" fill="${GOLD}" font-family="monospace" font-size="18" opacity="0.5">ansem.space</text>
    </svg>`;
  },
};

function templateScene(title, accent, golden = false, candle = false, moon = false, hazard = false) {
  const s = 1080;
  let extras = "";
  if (golden) extras = speedLines(s, s) + `<circle cx="540" cy="540" r="300" fill="${GOLD}" opacity="0.1"/>`;
  if (candle) {
    extras = `<rect x="420" y="200" width="80" height="500" fill="#16C784" rx="8"/>
      <rect x="400" y="180" width="120" height="30" fill="#16C784"/>
      <polyline points="200,800 300,600 400,650 500,400 600,500 700,300 800,450 900,350" fill="none" stroke="${GOLD}" stroke-width="4" opacity="0.5"/>`;
  }
  if (moon) {
    extras = `<circle cx="800" cy="200" r="120" fill="${BONE}" opacity="0.85"/>
      ${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 97) % s}" cy="${(i * 53) % 400}" r="1.5" fill="${BONE}" opacity="0.6"/>`).join("")}`;
  }
  if (hazard) {
    extras = Array.from({ length: 12 }, (_, i) =>
      `<rect x="0" y="${i * 90}" width="${s}" height="45" fill="${i % 2 ? CRIMSON : VOID}" opacity="0.35"/>`
    ).join("") + `<text x="100" y="300" fill="${CRIMSON_BRIGHT}" font-family="Impact" font-size="64" opacity="0.4" transform="rotate(-12 200 300)">REKT</text>
      <text x="600" y="700" fill="${CRIMSON_BRIGHT}" font-family="Impact" font-size="48" opacity="0.35">NGMI</text>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    <rect width="${s}" height="${s}" fill="${VOID}"/>
    ${radialBg(s, s)}${extras}
    ${bullSvg(540, 620, 3.2)}
    <text x="540" y="100" text-anchor="middle" fill="${accent}" font-family="Impact,sans-serif" font-size="56" font-weight="900" letter-spacing="4">${title}</text>
  </svg>`;
}

function spriteBull() {
  const s = 256;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    <rect width="${s}" height="${s}" fill="none"/>
    ${bullSvg(128, 140, 2.2)}
  </svg>`;
}

function spriteEmoji(emoji, color, label) {
  const s = 256;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    <rect width="${s}" height="${s}" fill="none"/>
    <text x="128" y="150" text-anchor="middle" font-size="100">${emoji}</text>
    <text x="128" y="220" text-anchor="middle" fill="${color}" font-family="monospace" font-size="22" font-weight="700">${label}</text>
  </svg>`;
}

function spriteBear() {
  const s = 256;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    <rect width="${s}" height="${s}" fill="none"/>
    <text x="128" y="130" text-anchor="middle" font-size="90">🐻</text>
    <rect x="40" y="180" width="176" height="14" fill="${CRIMSON_BRIGHT}" rx="2"/>
    <rect x="40" y="180" width="176" height="14" fill="none" stroke="${CRIMSON}" stroke-width="3"/>
  </svg>`;
}

function spriteCoin() {
  const s = 256;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    <defs><radialGradient id="cg"><stop offset="0%" stop-color="${GOLD_BRIGHT}"/><stop offset="100%" stop-color="${GOLD}"/></radialGradient></defs>
    <circle cx="128" cy="128" r="100" fill="url(#cg)" stroke="${GOLD_BRIGHT}" stroke-width="4"/>
    <text x="128" y="148" text-anchor="middle" fill="${VOID}" font-family="Impact" font-size="72" font-weight="900">A</text>
  </svg>`;
}

function spriteSolBag() {
  const s = 256;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    <ellipse cx="128" cy="200" rx="90" ry="40" fill="${GOLD}" opacity="0.9"/>
    <path d="M60 200 Q60 80 128 60 Q196 80 196 200 Z" fill="${GOLD_BRIGHT}" stroke="${GOLD}" stroke-width="3"/>
    <text x="128" y="155" text-anchor="middle" fill="${VOID}" font-family="monospace" font-size="36" font-weight="700">SOL</text>
    <rect x="108" y="40" width="40" height="30" rx="6" fill="${GOLD}" stroke="${GOLD_DIM}" stroke-width="2"/>
  </svg>`;
}

const GOLD_DIM = "#8C7326";

async function renderPng(svg) {
  return sharp(Buffer.from(svg)).png({ quality: 95, compressionLevel: 6 }).toBuffer();
}

async function uploadSlot(slot, buffer) {
  const blob = await put(`slots/${slot}.png`, buffer, {
    access: "public",
    token: TOKEN,
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 300,
    contentType: "image/png",
  });
  return blob.url;
}

console.log("Generating & uploading ANSEM Space assets…\n");
for (const [slot, gen] of Object.entries(GENERATORS)) {
  try {
    const svg = gen();
    const png = await renderPng(svg);
    const url = await uploadSlot(slot, png);
    console.log(`✓ ${slot} (${(png.length / 1024).toFixed(1)} KB) → ${url}`);
  } catch (e) {
    console.error(`✗ ${slot}:`, e.message);
  }
}
console.log("\nDone — assets live at /admin within ~5 min CDN refresh.");