"use client";

/**
 * SECTION 3 — HANDS (Diamond Hands)
 * Real-data culture section:
 *  - Live market stats via DexScreener (price, mcap, volume, 24h change)
 *  - Your status: real Herd Points profile (HP, rank, badges, streak)
 *  - Bag calculator on the live price
 *  - Diamond Division: real top holders via /api/holders (Helius)
 *  - Paperhand Memorial: real recent sells via /api/whales (Helius)
 *  - Shareable diamond-hands story card (canvas-generated)
 */

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { Gem, Share2, Wallet } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useHerd } from "@/components/HerdProvider";
import { useMarket } from "@/components/MarketProvider";
import { useWallet } from "@/components/WalletProvider";
import { drawBull } from "@/lib/bull";
import { slotUrl } from "@/lib/asset-manifest";
import { shareOnX } from "@/lib/constants";
import { fireConfetti } from "@/lib/confetti";
import { BADGES } from "@/lib/points";
import { cn, formatCompact, formatUsd, shortAddress } from "@/lib/utils";

/* ---------------- animated stat counter ---------------- */

function StatTile({
  value,
  suffix,
  label,
  accent,
  format,
}: {
  value: number;
  suffix: string;
  label: string;
  accent?: boolean;
  format?: (v: number) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: 2000, bounce: 0 });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (inView) mv.set(value);
  }, [inView, mv, value]);

  useEffect(() => {
    return spring.on("change", (v) => {
      if (format) setDisplay(format(v));
      else setDisplay(v >= 1000 ? Math.round(v).toLocaleString() : v.toFixed(0));
    });
  }, [spring, format]);

  return (
    <div
      ref={ref}
      className={cn(
        "border bg-panel px-5 py-6 shadow-panel [clip-path:polygon(12px_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%,0_12px)]",
        accent ? "border-gold/40" : "border-edge"
      )}
    >
      <p className={cn("font-display text-2xl tabular-nums sm:text-3xl", accent ? "text-gold" : "text-bone")}>
        {display}
        <span className="text-xl">{suffix}</span>
      </p>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ash">{label}</p>
    </div>
  );
}

/* ---------------- HP-based status tiers (real player data) ---------------- */

function getTier(totalHp: number) {
  if (totalHp >= 2000)
    return { label: "DIAMOND EMPEROR", emoji: "💎👑", color: "text-gold", desc: "You ARE the line others hold." };
  if (totalHp >= 750)
    return { label: "DIAMOND HANDS", emoji: "💎🙌", color: "text-gold", desc: "Unshakeable. The herd salutes you." };
  if (totalHp >= 200)
    return { label: "IRON GRIP", emoji: "🦾", color: "text-bone", desc: "Forged in the Charge. Keep stacking HP." };
  return { label: "FRESH HOOF", emoji: "🐂", color: "text-bone", desc: "Every legend starts here. Go earn some HP." };
}

/* ---------------- share-card generation ---------------- */

function generateStoryCard(
  name: string,
  story: string,
  tierLabel: string,
  bg?: HTMLImageElement | null
): string | null {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 675;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  if (bg) {
    ctx.drawImage(bg, 0, 0, 1200, 675);
    ctx.fillStyle = "rgba(10,10,10,0.42)";
    ctx.fillRect(0, 0, 1200, 675);
  } else {
    ctx.fillStyle = "#0A0A0A";
    ctx.fillRect(0, 0, 1200, 675);
    const g = ctx.createRadialGradient(600, 340, 60, 600, 340, 700);
    g.addColorStop(0, "rgba(212,175,55,0.14)");
    g.addColorStop(1, "rgba(212,175,55,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1200, 675);
    ctx.strokeStyle = "rgba(212,175,55,0.5)";
    ctx.lineWidth = 6;
    ctx.strokeRect(24, 24, 1152, 627);
    drawBull(ctx, 60, 60, 130, "gold");
  }

  ctx.fillStyle = "#D4AF37";
  ctx.font = "900 44px Impact, sans-serif";
  ctx.fillText("MY DIAMOND HANDS STORY", 230, 125);
  ctx.fillStyle = "#9A95A3";
  ctx.font = "700 22px monospace";
  ctx.fillText(`${name || "Anonymous Bull"} · ${tierLabel}`, 230, 165);

  // Wrap the story text
  ctx.fillStyle = "#F2EFE9";
  ctx.font = "600 34px Georgia, serif";
  const words = `“${story}”`.split(" ");
  let line = "";
  let y = 280;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > 1040 && line) {
      ctx.fillText(line, 80, y);
      line = word;
      y += 50;
      if (y > 540) break;
    } else line = test;
  }
  if (y <= 540) ctx.fillText(line, 80, y);

  ctx.fillStyle = "#C8102E";
  ctx.font = "700 24px monospace";
  ctx.fillText("HOLD THE LINE — ansem.space", 80, 610);
  return canvas.toDataURL("image/png");
}

/* ---------------- live halls (real chain data) ---------------- */

interface HolderDto {
  label: string;
  pct: number;
}
interface SellDto {
  wallet: string;
  amount: number;
  time?: number;
}

function useLiveHalls() {
  const [holders, setHolders] = useState<HolderDto[]>([]);
  const [sells, setSells] = useState<SellDto[]>([]);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/holders")
      .then((r) => r.json())
      .then((json: { source: string; holders: HolderDto[] }) => {
        if (cancelled) return;
        setHolders(json.holders.slice(0, 5));
        if (json.source === "helius") setLive(true);
      })
      .catch(() => {});
    fetch("/api/whales")
      .then((r) => r.json())
      .then((json: { txs: Array<SellDto & { action: string }> }) => {
        if (cancelled) return;
        setSells(json.txs.filter((t) => t.action === "SELL").slice(0, 4));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return { holders, sells, live };
}

/* ---------------- section ---------------- */

export function Hands() {
  const { address, connect, connecting } = useWallet();
  const { data, rank } = useHerd();
  const market = useMarket();
  const { holders, sells, live } = useLiveHalls();
  const tier = getTier(data.total);

  // Bag value calculator — live price, real math.
  const [bagTokens, setBagTokens] = useState(1_000_000);
  const bagValue = bagTokens * market.price;

  // Story modal
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyName, setStoryName] = useState("");
  const [storyText, setStoryText] = useState("");
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [storyBg, setStoryBg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    fetch("/api/assets")
      .then((r) => r.json())
      .then((json) => {
        const s = json.slots?.["story-card-bg"];
        const url = s?.url ? `${s.url}?v=${s.uploadedAt}` : slotUrl("story-card-bg");
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => setStoryBg(img);
        img.src = url;
      })
      .catch(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => setStoryBg(img);
        img.src = slotUrl("story-card-bg");
      });
  }, []);

  function makeCard() {
    if (!storyText.trim()) return;
    const url = generateStoryCard(storyName, storyText.trim(), tier.label, storyBg);
    setCardUrl(url);
    if (url) fireConfetti({ count: 80 });
  }

  return (
    <section id="hands" className="relative scroll-mt-16 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          kicker="Section 03 — Culture"
          title="Hands"
          sub="This coin runs on grip strength. Live market stats, your real standing in the herd, and the wallets actually holding the line — straight from the chain."
        />

        {/* Live market stats via DexScreener */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile
            value={market.price}
            suffix=""
            label={market.live ? "Live price · DexScreener" : "Price (connecting…)"}
            accent
            format={(v) => `$${v < 0.001 ? v.toFixed(7) : v.toFixed(4)}`}
          />
          <StatTile value={market.marketCap} suffix="" label="Market cap" format={(v) => formatUsd(v, 0)} />
          <StatTile value={market.volume24h} suffix="" label="24h volume" accent format={(v) => formatUsd(v, 0)} />
          <StatTile
            value={market.change24h}
            suffix="%"
            label="24h change"
            format={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}`}
          />
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {/* My Status — real Herd profile */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="border border-gold/25 bg-panel p-6 shadow-panel [clip-path:polygon(14px_0,100%_0,100%_calc(100%-14px),calc(100%-14px)_100%,0_100%,0_14px)]"
          >
            <h3 className="flex items-center gap-2 font-display text-sm uppercase tracking-widest text-gold">
              <Gem size={16} /> My Status
            </h3>

            <motion.div key={data.total} initial={{ opacity: 0.6 }} animate={{ opacity: 1 }} className="mt-5">
              <p className="text-4xl">{tier.emoji}</p>
              <p className={cn("mt-2 font-display text-2xl uppercase tracking-wide", tier.color)}>
                {tier.label}
              </p>
              <p className="mt-1 text-sm text-ash">{tier.desc}</p>
              <dl className="mt-5 grid grid-cols-3 gap-3 font-mono text-xs">
                <div className="border border-edge px-3 py-2.5">
                  <dt className="text-ash">Herd Points</dt>
                  <dd className="mt-1 text-lg text-gold">{data.total.toLocaleString()}</dd>
                </div>
                <div className="border border-edge px-3 py-2.5">
                  <dt className="text-ash">Rank</dt>
                  <dd className="mt-1 text-lg text-bone">#{rank}</dd>
                </div>
                <div className="border border-edge px-3 py-2.5">
                  <dt className="text-ash">Badges</dt>
                  <dd className="mt-1 text-lg text-gold">
                    {data.badges.length}/{BADGES.length}
                  </dd>
                </div>
              </dl>
              {address ? (
                <p className="mt-3 font-mono text-[10px] text-ash">
                  {shortAddress(address, 6)} · streak {data.streak} day{data.streak === 1 ? "" : "s"}
                </p>
              ) : (
                <div className="mt-4">
                  <Button size="sm" onClick={connect} disabled={connecting}>
                    <Wallet size={14} /> {connecting ? "Connecting…" : "Connect to bind your status"}
                  </Button>
                </div>
              )}
              <Button
                size="sm"
                variant="crimson"
                className="mt-4"
                onClick={() =>
                  shareOnX(
                    `I'm ranked ${tier.label} ${tier.emoji} with ${data.total.toLocaleString()} Herd Points on ansem.space. Come take my rank:`
                  )
                }
              >
                <Share2 size={14} /> Flex status on X
              </Button>
            </motion.div>

            {/* Bag calculator — live price */}
            <div className="mt-8 border-t border-edge pt-6">
              <h4 className="font-display text-xs uppercase tracking-widest text-bone">
                What's your bag worth right now?
              </h4>
              <label className="mt-3 block font-mono text-[10px] uppercase tracking-[0.2em] text-ash">
                Bag size: {(bagTokens / 1e6).toFixed(1)}M $ANSEM
              </label>
              <input
                type="range"
                min={100000}
                max={20000000}
                step={100000}
                value={bagTokens}
                onChange={(e) => setBagTokens(Number(e.target.value))}
                className="mt-2 w-full accent-gold"
              />
              <div className="mt-4 border border-gold/40 bg-gold/5 px-4 py-4 text-center">
                <p className="font-mono text-[10px] uppercase tracking-widest text-gold">
                  Live value {market.live ? "· DexScreener" : "· connecting…"}
                </p>
                <p className="mt-1 font-display text-2xl text-gold">
                  {market.live ? formatUsd(bagValue) : "—"}
                </p>
                <p className="mt-1 text-[10px] text-ash">
                  at ${market.price < 0.001 ? market.price.toFixed(7) : market.price.toFixed(4)} ·{" "}
                  {market.change24h >= 0 ? "+" : ""}
                  {market.change24h.toFixed(1)}% today
                </p>
              </div>
            </div>
          </motion.div>

          {/* Live halls */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
            <div className="border border-edge bg-panel p-6 shadow-panel [clip-path:polygon(14px_0,100%_0,100%_calc(100%-14px),calc(100%-14px)_100%,0_100%,0_14px)]">
              <h3 className="font-display text-sm uppercase tracking-widest text-gold">
                💎 Diamond Division — Top Holders
              </h3>
              <p className="mt-1 font-mono text-[10px] text-ash">
                {live
                  ? "Live from the Solana chain via Helius · the largest wallet is usually the liquidity pool"
                  : "Loading chain data…"}
              </p>
              <div className="mt-4 space-y-3">
                {holders.length === 0 && (
                  <p className="py-4 text-center font-mono text-xs text-ash">Reading the chain…</p>
                )}
                {holders.map((h, i) => (
                  <div
                    key={`${h.label}-${i}`}
                    className="flex items-center justify-between gap-3 border-b border-edge/50 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn("font-mono text-xs", i === 0 ? "text-gold" : "text-ash")}>
                        {i + 1}
                      </span>
                      <p className="font-mono text-xs text-bone">{h.label}</p>
                      {i === 0 && <span className="text-xs">👑</span>}
                    </div>
                    <span className="shrink-0 font-mono text-xs text-gold">{h.pct.toFixed(2)}% of supply</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-crimson/30 bg-panel p-6 shadow-panel [clip-path:polygon(14px_0,100%_0,100%_calc(100%-14px),calc(100%-14px)_100%,0_100%,0_14px)]">
              <h3 className="font-display text-sm uppercase tracking-widest text-crimson-bright">
                🧻 Paperhand Memorial — Recent Sells
              </h3>
              <p className="mt-1 font-mono text-[10px] text-ash">
                Real sells from the whale feed. Gone, but not forgotten. Mostly forgotten.
              </p>
              <div className="mt-4 space-y-3">
                {sells.length === 0 ? (
                  <p className="py-3 text-center text-xs text-gold">
                    No recent sells detected — the herd holds. 💎
                  </p>
                ) : (
                  sells.map((s, i) => (
                    <div
                      key={`${s.wallet}-${i}`}
                      className="flex items-start justify-between gap-3 border-b border-edge/50 pb-3 last:border-0 last:pb-0"
                    >
                      <p className="font-mono text-xs text-bone">
                        {s.wallet}
                        <span className="mt-0.5 block text-[11px] text-ash">
                          paper-handed {formatCompact(s.amount)} $ANSEM
                        </span>
                      </p>
                      <span className="shrink-0 font-mono text-[10px] text-crimson-bright">SOLD</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                setCardUrl(null);
                setStoryOpen(true);
              }}
            >
              <Gem size={16} /> Share your diamond hands story
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Story modal */}
      <Dialog open={storyOpen} onClose={() => setStoryOpen(false)} title="Diamond Hands Story">
        {!cardUrl ? (
          <div className="space-y-4">
            <input
              value={storyName}
              onChange={(e) => setStoryName(e.target.value)}
              maxLength={24}
              placeholder="Your handle (optional)"
              className="w-full border border-edge bg-void px-3 py-2.5 text-sm text-bone outline-none placeholder:text-ash/50 focus:border-gold/60"
            />
            <textarea
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
              maxLength={220}
              rows={4}
              placeholder="Tell the herd how you held the line… (e.g. 'Held through a -60% wick while my group chat called me insane.')"
              className="w-full resize-none border border-edge bg-void px-3 py-2.5 text-sm text-bone outline-none placeholder:text-ash/50 focus:border-gold/60"
            />
            <Button className="w-full" onClick={makeCard} disabled={!storyText.trim()}>
              Generate shareable card
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cardUrl} alt="Your diamond hands story card" className="w-full border border-gold/30" />
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => {
                  const a = document.createElement("a");
                  a.download = "ansem-diamond-hands.png";
                  a.href = cardUrl;
                  a.click();
                }}
              >
                Download
              </Button>
              <Button
                variant="crimson"
                className="flex-1"
                onClick={() => shareOnX(`My diamond hands story 💎🙌 "${storyText.slice(0, 120)}" — forged at`)}
              >
                <Share2 size={14} /> Share to X
              </Button>
            </div>
            <button
              onClick={() => setCardUrl(null)}
              className="w-full text-center font-mono text-xs text-ash hover:text-bone"
            >
              ← Edit story
            </button>
          </div>
        )}
      </Dialog>
    </section>
  );
}
