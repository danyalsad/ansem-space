"use client";

/**
 * SECTION 1 — THE FORGE (Meme Lab)
 * Canvas meme generator (procedural Black Bull templates, text styling,
 * sticker upload, preset captions) + community gallery persisted in
 * localStorage with upvotes, sorting and X sharing.
 */

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownToLine,
  Dices,
  Flame,
  ImagePlus,
  Share2,
  Sparkles,
  ThumbsUp,
  Upload,
} from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { useHerd } from "@/components/HerdProvider";
import { fileToDataUrl, listAssets, saveAsset, type SiteAsset } from "@/lib/assets";
import { drawBull } from "@/lib/bull";
import { LS, shareOnX } from "@/lib/constants";
import { fireConfetti } from "@/lib/confetti";
import { cn, store } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Templates: each draws a full 1080x1080 scene procedurally.           */
/* ------------------------------------------------------------------ */

interface Template {
  id: string;
  name: string;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

function speedLines(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  for (let i = 0; i < 26; i++) {
    const y = (h / 26) * i + 10;
    const len = 80 + ((i * 977) % 240);
    ctx.globalAlpha = 0.12 + ((i * 31) % 10) / 60;
    ctx.beginPath();
    ctx.moveTo(w - ((i * 431) % (w * 0.5)), y);
    ctx.lineTo(w - ((i * 431) % (w * 0.5)) - len, y);
    ctx.stroke();
  }
  ctx.restore();
}

const TEMPLATES: Template[] = [
  {
    id: "golden-charge",
    name: "Golden Charge",
    draw(ctx, w, h) {
      ctx.fillStyle = "#0A0A0A";
      ctx.fillRect(0, 0, w, h);
      const g = ctx.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, w * 0.7);
      g.addColorStop(0, "rgba(212,175,55,0.28)");
      g.addColorStop(1, "rgba(212,175,55,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      speedLines(ctx, w, h, "#D4AF37");
      drawBull(ctx, w * 0.2, h * 0.2, w * 0.6, "gold");
    },
  },
  {
    id: "red-candle-god",
    name: "Red Candle God",
    draw(ctx, w, h) {
      ctx.fillStyle = "#0A0A0A";
      ctx.fillRect(0, 0, w, h);
      // Rising candle chart, last candle god-tier green
      const candles = [
        { x: 0.08, o: 0.72, c: 0.66, up: true },
        { x: 0.2, o: 0.66, c: 0.7, up: false },
        { x: 0.32, o: 0.7, c: 0.58, up: true },
        { x: 0.44, o: 0.58, c: 0.62, up: false },
        { x: 0.56, o: 0.62, c: 0.44, up: true },
        { x: 0.68, o: 0.44, c: 0.5, up: false },
        { x: 0.8, o: 0.5, c: 0.16, up: true },
      ];
      for (const cd of candles) {
        const cx = cd.x * w;
        const top = Math.min(cd.o, cd.c) * h;
        const bot = Math.max(cd.o, cd.c) * h;
        ctx.strokeStyle = cd.up ? "#16C784" : "#FF2E2E";
        ctx.fillStyle = cd.up ? "#16C784" : "#FF2E2E";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(cx + w * 0.035, top - 40);
        ctx.lineTo(cx + w * 0.035, bot + 40);
        ctx.stroke();
        ctx.fillRect(cx, top, w * 0.07, Math.max(12, bot - top));
      }
      const g = ctx.createRadialGradient(w * 0.83, h * 0.16, 20, w * 0.83, h * 0.16, 400);
      g.addColorStop(0, "rgba(212,175,55,0.35)");
      g.addColorStop(1, "rgba(212,175,55,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // Bull surfing the god candle
      drawBull(ctx, w * 0.66, h * 0.02, w * 0.34, "gold");
    },
  },
  {
    id: "moon-mission",
    name: "Moon Mission",
    draw(ctx, w, h) {
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, "#05050C");
      sky.addColorStop(1, "#141024");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      // Stars (deterministic)
      ctx.fillStyle = "#EDE8DC";
      for (let i = 0; i < 140; i++) {
        const x = (i * 811) % w;
        const y = (i * 487) % h;
        const r = ((i * 13) % 3) * 0.8 + 0.6;
        ctx.globalAlpha = 0.3 + ((i * 7) % 10) / 14;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // Moon
      const mg = ctx.createRadialGradient(w * 0.8, h * 0.18, 30, w * 0.8, h * 0.18, 190);
      mg.addColorStop(0, "#FFF8D6");
      mg.addColorStop(0.8, "#D9CFA8");
      mg.addColorStop(1, "rgba(217,207,168,0)");
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(w * 0.8, h * 0.18, 190, 0, Math.PI * 2);
      ctx.fill();
      // Tilted charging bull
      ctx.save();
      ctx.translate(w * 0.5, h * 0.62);
      ctx.rotate(-0.35);
      drawBull(ctx, -w * 0.28, -w * 0.28, w * 0.56, "gold");
      ctx.restore();
      speedLines(ctx, w, h, "#EDE8DC");
    },
  },
  {
    id: "paperhands-down",
    name: "Paperhands Down",
    draw(ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#1A0505");
      g.addColorStop(1, "#0A0A0A");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // Diagonal crimson hazard stripes
      ctx.save();
      ctx.rotate(-0.3);
      for (let i = -6; i < 20; i++) {
        ctx.fillStyle = i % 2 ? "rgba(200,16,46,0.08)" : "transparent";
        ctx.fillRect(i * 120, -h, 120, h * 3);
      }
      ctx.restore();
      // Scattered REKT text
      ctx.font = `700 44px Impact, sans-serif`;
      ctx.fillStyle = "rgba(200,16,46,0.25)";
      const words = ["REKT", "NGMI", "SOLD?", "PAPER"];
      for (let i = 0; i < 10; i++) {
        ctx.save();
        ctx.translate((i * 733) % w, (i * 911) % h);
        ctx.rotate((((i * 37) % 60) - 30) * 0.02);
        ctx.fillText(words[i % words.length], 0, 0);
        ctx.restore();
      }
      drawBull(ctx, w * 0.22, h * 0.22, w * 0.56, "gold");
    },
  },
  {
    id: "blank-void",
    name: "Blank Void",
    draw(ctx, w, h) {
      ctx.fillStyle = "#0A0A0A";
      ctx.fillRect(0, 0, w, h);
      const g = ctx.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, w * 0.75);
      g.addColorStop(0, "rgba(212,175,55,0.07)");
      g.addColorStop(1, "rgba(212,175,55,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      drawBull(ctx, w * 0.3, h * 0.3, w * 0.4, "silhouette");
      ctx.strokeStyle = "rgba(212,175,55,0.35)";
      ctx.lineWidth = 10;
      ctx.strokeRect(20, 20, w - 40, h - 40);
    },
  },
];

const FONTS = [
  { id: "impact", label: "Impact", css: "Impact, 'Arial Black', sans-serif" },
  { id: "display", label: "Unbounded", css: "var(--font-display), sans-serif" },
  { id: "mono", label: "Mono", css: "var(--font-mono), monospace" },
];

const PRESET_CAPTIONS: Array<[string, string]> = [
  ["WHEN ANSEM AIRDROPS", "AND YOU'RE STILL HOLDING"],
  ["PAPERHANDS:", "COULDN'T BE ME"],
  ["I DON'T SELL", "I MULTIPLY"],
  ["THE BLACK BULL", "FEARS NO CANDLE"],
  ["SOLD AT 2X?", "ENJOY YOUR KEBAB"],
  ["ME CHECKING $ANSEM", "EVERY 4 SECONDS"],
  ["DIAMOND HANDS", "FORGED IN THE DIP"],
  ["HOLD THE LINE", "THE HERD IS WATCHING"],
];

/* ------------------------------------------------------------------ */
/* Gallery types + seed data                                            */
/* ------------------------------------------------------------------ */

export interface GalleryMeme {
  id: string;
  caption: string;
  author: string;
  votes: number;
  ts: number;
  image?: string; // dataURL when generated/uploaded; text-card otherwise
  gradient?: string;
}

const SEED_MEMES: GalleryMeme[] = [
  { id: "seed-1", caption: "Ansem said hold. I held. My wife's boyfriend is proud of me.", author: "BullPoster", votes: 420, ts: 1719000000000, gradient: "from-gold/25 to-crimson/20" },
  { id: "seed-2", caption: "POV: you're a bear watching the herd charge past your shorts", author: "hoofprints.sol", votes: 313, ts: 1719400000000, gradient: "from-crimson/25 to-void" },
  { id: "seed-3", caption: "My exit strategy? The blockchain is my heir.", author: "DiamondDoc", votes: 269, ts: 1719800000000, gradient: "from-gold/20 to-abyss" },
  { id: "seed-4", caption: "Paperhands sold for gas money. I AM the gas.", author: "TheBlackBull", votes: 187, ts: 1720100000000, gradient: "from-bone/10 to-crimson/15" },
];

type SortMode = "top" | "new";

/* ------------------------------------------------------------------ */

export function Forge() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stickerRef = useRef<HTMLImageElement | null>(null);
  const { earn } = useHerd();

  // Custom image templates (user uploads + admin assets, see lib/assets.ts)
  const [customTemplates, setCustomTemplates] = useState<SiteAsset[]>([]);
  const templateImgCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const [imgTick, setImgTick] = useState(0); // re-render when a template image finishes loading

  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [topText, setTopText] = useState("WHEN ANSEM AIRDROPS");
  const [bottomText, setBottomText] = useState("AND YOU'RE STILL HOLDING");
  const [font, setFont] = useState(FONTS[0]);
  const [textColor, setTextColor] = useState("#EDE8DC");
  const [outline, setOutline] = useState(true);
  const [glow, setGlow] = useState(false);
  const [textSize, setTextSize] = useState(88);
  const [stickerPos, setStickerPos] = useState<"tl" | "tr" | "bl" | "br" | "c">("br");
  const [stickerLoaded, setStickerLoaded] = useState(false);

  const [memes, setMemes] = useState<GalleryMeme[]>(SEED_MEMES);
  const [voted, setVoted] = useState<string[]>([]);
  const [sort, setSort] = useState<SortMode>("top");
  const [uploadCaption, setUploadCaption] = useState("");

  /* ---------------- custom + global templates ---------------- */

  // Global (admin-uploaded, Blob-hosted) assets — same for every visitor.
  const [slotOverrides, setSlotOverrides] = useState<Record<string, string>>({});
  const [globalLibrary, setGlobalLibrary] = useState<Array<{ id: string; name: string; url: string; category: string }>>([]);

  /** Wrap an image (local dataURL or remote Blob URL) as a canvas template. */
  const imageTemplate = useCallback((id: string, name: string, src: string): Template => {
    return {
      id,
      name,
      draw: (ctx, w, h) => {
        ctx.fillStyle = "#0A0A0A";
        ctx.fillRect(0, 0, w, h);
        let img = templateImgCache.current.get(id);
        if (!img) {
          img = new Image();
          if (src.startsWith("http")) img.crossOrigin = "anonymous"; // keep canvas exportable
          img.onload = () => setImgTick((t) => t + 1);
          img.src = src;
          templateImgCache.current.set(id, img);
        }
        if (img.complete && img.width > 0) {
          const scale = Math.max(w / img.width, h / img.height);
          const dw = img.width * scale;
          const dh = img.height * scale;
          ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
        }
      },
    };
  }, []);

  const assetToTemplate = useCallback(
    (asset: SiteAsset): Template => imageTemplate(asset.id, asset.name, asset.dataUrl),
    [imageTemplate]
  );

  useEffect(() => {
    // Personal templates (this browser only)
    listAssets().then((all) =>
      setCustomTemplates(all.filter((a) => a.category === "template" || a.category === "background"))
    );
    // Global assets (admin uploads on Vercel Blob)
    fetch("/api/assets")
      .then((r) => r.json())
      .then((json: { slots: Record<string, { url: string; uploadedAt: string }>; library: Array<{ url: string; pathname: string; name: string; category: string }> }) => {
        const overrides: Record<string, string> = {};
        for (const [slot, v] of Object.entries(json.slots ?? {})) {
          if (slot.startsWith("template-")) {
            overrides[slot.replace("template-", "")] = `${v.url}?v=${v.uploadedAt}`;
          }
        }
        setSlotOverrides(overrides);
        setGlobalLibrary(
          (json.library ?? []).map((a) => ({ id: a.pathname, name: a.name, url: a.url, category: a.category }))
        );
      })
      .catch(() => {});
  }, []);

  const allTemplates: Template[] = [
    // Built-ins — replaced by the HD version when the admin uploaded one.
    ...TEMPLATES.map((t) =>
      slotOverrides[t.id] ? imageTemplate(t.id, t.name, slotOverrides[t.id]) : t
    ),
    ...globalLibrary
      .filter((a) => a.category === "template" || a.category === "background")
      .map((a) => imageTemplate(a.id, a.name, a.url)),
    ...customTemplates.map(assetToTemplate),
  ];

  const globalStickers = globalLibrary.filter((a) => a.category === "sticker");

  /* ---------------- canvas render ---------------- */

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    template.draw(ctx, w, h);

    // Sticker overlay
    const sticker = stickerRef.current;
    if (sticker && stickerLoaded) {
      const size = w * 0.28;
      const ratio = sticker.height / sticker.width || 1;
      const sw = size;
      const sh = size * ratio;
      const pad = 36;
      const pos = {
        tl: [pad, pad],
        tr: [w - sw - pad, pad],
        bl: [pad, h - sh - pad],
        br: [w - sw - pad, h - sh - pad],
        c: [(w - sw) / 2, (h - sh) / 2],
      }[stickerPos];
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 24;
      ctx.drawImage(sticker, pos[0], pos[1], sw, sh);
      ctx.restore();
    }

    // Meme text
    const drawText = (text: string, y: number, baseline: CanvasTextBaseline) => {
      if (!text.trim()) return;
      ctx.save();
      ctx.font = `900 ${textSize}px ${font.css}`;
      ctx.textAlign = "center";
      ctx.textBaseline = baseline;
      if (glow) {
        ctx.shadowColor = "#D4AF37";
        ctx.shadowBlur = 34;
      }
      // Word-wrap at canvas width
      const maxWidth = w - 90;
      const words = text.toUpperCase().split(" ");
      const lines: string[] = [];
      let line = "";
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else line = test;
      }
      lines.push(line);
      const lineH = textSize * 1.08;
      lines.forEach((l, i) => {
        const ly = baseline === "top" ? y + i * lineH : y - (lines.length - 1 - i) * lineH;
        if (outline) {
          ctx.lineWidth = Math.max(6, textSize / 9);
          ctx.strokeStyle = "#000000";
          ctx.lineJoin = "round";
          ctx.strokeText(l, w / 2, ly);
        }
        ctx.fillStyle = textColor;
        ctx.fillText(l, w / 2, ly);
      });
      ctx.restore();
    };

    drawText(topText, 44, "top");
    drawText(bottomText, h - 44, "bottom");
  }, [template, topText, bottomText, font, textColor, outline, glow, textSize, stickerPos, stickerLoaded]);

  useEffect(() => {
    render();
  }, [render, imgTick]);

  /* ---------------- gallery persistence ---------------- */

  useEffect(() => {
    const saved = store.get<GalleryMeme[]>(LS.memes, []);
    setMemes([...saved, ...SEED_MEMES]);
    setVoted(store.get<string[]>(LS.memeVotes, []));
  }, []);

  function persistUserMemes(all: GalleryMeme[]) {
    // Only user-created memes go to storage; seeds are rebuilt on load.
    store.set(
      LS.memes,
      all.filter((m) => !m.id.startsWith("seed-"))
    );
  }

  function addMemeToGallery(image: string | undefined, caption: string) {
    const meme: GalleryMeme = {
      id: `user-${Date.now()}`,
      caption: caption || "Fresh from the Forge 🔥",
      author: "You",
      votes: 1,
      ts: Date.now(),
      image,
      gradient: "from-gold/20 to-crimson/15",
    };
    setMemes((prev) => {
      const next = [meme, ...prev];
      persistUserMemes(next);
      return next;
    });
    earn("meme_post"); // +50 HP, counts toward Meme Lord badge
    fireConfetti({ count: 90 });
  }

  function upvote(id: string) {
    if (voted.includes(id)) return;
    setMemes((prev) => {
      const next = prev.map((m) => (m.id === id ? { ...m, votes: m.votes + 1 } : m));
      persistUserMemes(next);
      return next;
    });
    const nextVoted = [...voted, id];
    setVoted(nextVoted);
    store.set(LS.memeVotes, nextVoted);
    earn("upvote"); // +5 HP, counts toward Voice of the Herd badge
  }

  /** Upload a custom image as a reusable meme template. */
  async function onTemplateUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file, 1080);
    const asset = await saveAsset(file.name.replace(/\.\w+$/, ""), "template", dataUrl);
    const all = await listAssets();
    setCustomTemplates(all.filter((a) => a.category === "template" || a.category === "background"));
    setTemplate(assetToTemplate(asset));
    e.target.value = "";
  }

  /* ---------------- actions ---------------- */

  function onStickerUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      stickerRef.current = img;
      setStickerLoaded(true);
    };
    img.src = URL.createObjectURL(file);
  }

  function onGalleryUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => addMemeToGallery(String(reader.result), uploadCaption);
    reader.readAsDataURL(file);
    e.target.value = "";
    setUploadCaption("");
  }

  function rollCaption() {
    const [t, b] = PRESET_CAPTIONS[Math.floor(Math.random() * PRESET_CAPTIONS.length)];
    setTopText(t);
    setBottomText(b);
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = `ansem-meme-${Date.now()}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
    fireConfetti({ count: 70 });
  }

  function shareMemeToX() {
    // X intent can't attach images — download it, then open the pre-filled compose.
    download();
    shareOnX(`Just forged this in the ANSEM Space Meme Lab 🐂🔥 ${topText} ${bottomText}`.trim());
  }

  function saveToGallery() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // JPEG at 0.72 keeps localStorage happy.
    addMemeToGallery(canvas.toDataURL("image/jpeg", 0.72), `${topText} ${bottomText}`.trim());
  }

  const sorted = [...memes].sort((a, b) => (sort === "top" ? b.votes - a.votes : b.ts - a.ts));

  /* ---------------- render ---------------- */

  const labelCls = "font-mono text-[10px] uppercase tracking-[0.25em] text-ash";
  const inputCls =
    "w-full border border-edge bg-void px-3 py-2.5 font-body text-sm text-bone outline-none transition-colors placeholder:text-ash/50 focus:border-gold/60";

  return (
    <section id="forge" className="relative scroll-mt-16 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          kicker="Section 01 — Meme Lab"
          title="The Forge"
          sub="Weapons-grade meme production. Pick a Black Bull template, stamp your words on it, drop your own sticker, and unleash it on the timeline."
        />

        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* Canvas preview */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="relative border border-gold/20 bg-abyss p-2 shadow-panel [clip-path:polygon(14px_0,100%_0,100%_calc(100%-14px),calc(100%-14px)_100%,0_100%,0_14px)]">
              <canvas
                ref={canvasRef}
                width={1080}
                height={1080}
                className="w-full"
                aria-label="Meme preview canvas"
              />
              <span className="absolute right-4 top-4 bg-void/70 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-gold/70">
                Live preview
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={download}>
                <ArrowDownToLine size={15} /> Download PNG
              </Button>
              <Button variant="crimson" onClick={shareMemeToX}>
                <Share2 size={15} /> Share to X
              </Button>
              <Button variant="outline" onClick={saveToGallery}>
                <Flame size={15} /> Post to Gallery
              </Button>
            </div>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-5 border border-edge bg-panel p-5 shadow-panel [clip-path:polygon(14px_0,100%_0,100%_calc(100%-14px),calc(100%-14px)_100%,0_100%,0_14px)]"
          >
            <div>
              <span className={labelCls}>Template</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {allTemplates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t)}
                    className={cn(
                      "border px-3 py-2.5 text-left font-display text-[10px] uppercase tracking-wider transition-all",
                      template.id === t.id
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-edge text-ash hover:border-gold/40 hover:text-bone"
                    )}
                  >
                    {t.name}
                  </button>
                ))}
                <label className="flex cursor-pointer items-center justify-center gap-1.5 border border-dashed border-gold/30 px-3 py-2.5 font-display text-[10px] uppercase tracking-wider text-ash transition-colors hover:border-gold/60 hover:text-gold">
                  <ImagePlus size={12} /> Add your own
                  <input type="file" accept="image/*" className="hidden" onChange={onTemplateUpload} />
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className={labelCls}>Top text</span>
                <input className={cn(inputCls, "mt-1.5")} value={topText} maxLength={60} onChange={(e) => setTopText(e.target.value)} placeholder="TOP TEXT" />
              </div>
              <div>
                <span className={labelCls}>Bottom text</span>
                <input className={cn(inputCls, "mt-1.5")} value={bottomText} maxLength={60} onChange={(e) => setBottomText(e.target.value)} placeholder="BOTTOM TEXT" />
              </div>
              <Button variant="ghost" size="sm" onClick={rollCaption} className="w-full border border-dashed border-gold/30">
                <Dices size={14} /> Random preset caption
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className={labelCls}>Font</span>
                <select
                  className={cn(inputCls, "mt-1.5")}
                  value={font.id}
                  onChange={(e) => setFont(FONTS.find((f) => f.id === e.target.value) ?? FONTS[0])}
                >
                  {FONTS.map((f) => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className={labelCls}>Color</span>
                <div className="mt-1.5 flex gap-1.5">
                  {["#EDE8DC", "#D4AF37", "#FF2E2E", "#16C784"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setTextColor(c)}
                      aria-label={`Text color ${c}`}
                      className={cn(
                        "h-9 flex-1 border transition-transform hover:scale-105",
                        textColor === c ? "border-bone" : "border-edge"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <span className={labelCls}>Text size — {textSize}px</span>
              <input
                type="range"
                min={48}
                max={140}
                value={textSize}
                onChange={(e) => setTextSize(Number(e.target.value))}
                className="mt-2 w-full accent-gold"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setOutline((o) => !o)}
                className={cn(
                  "flex-1 border px-3 py-2 font-display text-[10px] uppercase tracking-wider transition-colors",
                  outline ? "border-gold bg-gold/10 text-gold" : "border-edge text-ash"
                )}
              >
                Outline
              </button>
              <button
                onClick={() => setGlow((g) => !g)}
                className={cn(
                  "flex-1 border px-3 py-2 font-display text-[10px] uppercase tracking-wider transition-colors",
                  glow ? "border-gold bg-gold/10 text-gold" : "border-edge text-ash"
                )}
              >
                <Sparkles size={12} className="mr-1 inline" /> Gold glow
              </button>
            </div>

            <div>
              <span className={labelCls}>Sticker overlay</span>
              <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 border border-dashed border-gold/30 px-3 py-3 font-display text-[10px] uppercase tracking-wider text-ash transition-colors hover:border-gold/60 hover:text-gold">
                <ImagePlus size={14} /> {stickerLoaded ? "Replace sticker" : "Upload image"}
                <input type="file" accept="image/*" className="hidden" onChange={onStickerUpload} />
              </label>
              {globalStickers.length > 0 && (
                <div className="mt-2">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-ash/70">
                    Community sticker pack
                  </span>
                  <div className="mt-1.5 grid grid-cols-5 gap-1.5">
                    {globalStickers.slice(0, 10).map((s) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={s.id}
                        src={s.url}
                        alt={s.name}
                        title={s.name}
                        className="aspect-square cursor-pointer border border-edge object-contain p-0.5 transition-all hover:border-gold"
                        onClick={() => {
                          const img = new Image();
                          img.crossOrigin = "anonymous";
                          img.onload = () => {
                            stickerRef.current = img;
                            setStickerLoaded(true);
                          };
                          img.src = s.url;
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              {stickerLoaded && (
                <div className="mt-2 grid grid-cols-5 gap-1.5">
                  {(["tl", "tr", "c", "bl", "br"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setStickerPos(p)}
                      className={cn(
                        "border py-1.5 font-mono text-[10px] uppercase transition-colors",
                        stickerPos === p ? "border-gold text-gold" : "border-edge text-ash"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ------------- Community Gallery ------------- */}
        <div className="mt-20">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <h3 className="font-display text-xl uppercase tracking-wide text-bone sm:text-2xl">
              Community <span className="text-gold">Gallery</span>
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex border border-edge">
                {(["top", "new"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setSort(m)}
                    className={cn(
                      "px-4 py-2 font-display text-[10px] uppercase tracking-wider transition-colors",
                      sort === m ? "bg-gold/15 text-gold" : "text-ash hover:text-bone"
                    )}
                  >
                    {m === "top" ? "Most Upvoted" : "Newest"}
                  </button>
                ))}
              </div>
              <label className="flex cursor-pointer items-center gap-2 border border-gold/40 px-4 py-2 font-display text-[10px] uppercase tracking-wider text-gold transition-all hover:bg-gold/10">
                <Upload size={13} /> Upload meme
                <input type="file" accept="image/*" className="hidden" onChange={onGalleryUpload} />
              </label>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {sorted.map((meme, i) => (
              <motion.article
                key={meme.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: Math.min(i * 0.06, 0.4) }}
                className="group flex flex-col border border-edge bg-panel transition-colors hover:border-gold/40"
              >
                {meme.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={meme.image} alt={meme.caption} className="aspect-square w-full object-cover" />
                ) : (
                  <div
                    className={cn(
                      "flex aspect-square items-center justify-center bg-gradient-to-br p-6",
                      meme.gradient
                    )}
                  >
                    <p className="text-center font-display text-sm uppercase leading-relaxed tracking-wide text-bone">
                      “{meme.caption}”
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 border-t border-edge px-3 py-2.5">
                  <span className="truncate font-mono text-[10px] text-ash">@{meme.author}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => upvote(meme.id)}
                      disabled={voted.includes(meme.id)}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 font-mono text-[11px] transition-colors",
                        voted.includes(meme.id) ? "text-gold" : "text-ash hover:text-gold"
                      )}
                      title="Upvote"
                    >
                      <ThumbsUp size={12} /> {meme.votes}
                    </button>
                    <button
                      onClick={() => shareOnX(`"${meme.caption}" — via the ANSEM Space community gallery 🐂`)}
                      className="p-1.5 text-ash transition-colors hover:text-gold"
                      title="Share to X"
                    >
                      <Share2 size={12} />
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
