"use client";

/**
 * SECTION 3 — HANDS (Diamond Hands)
 * Community-culture section: animated holder stats, personalized (simulated)
 * diamond-hand status from the connected wallet, a "what if you held"
 * calculator, Hall of Fame / Hall of Shame, and a canvas-generated
 * shareable diamond-hands story card.
 */

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { Gem, Share2, Wallet } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useWallet } from "@/components/WalletProvider";
import { useMarket } from "@/components/MarketProvider";
import { drawBull } from "@/lib/bull";
import { shareOnX } from "@/lib/constants";
import { fireConfetti } from "@/lib/confetti";
import { cn, formatUsd, hashString, seededRandom, shortAddress } from "@/lib/utils";

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
      <p className={cn("font-display text-3xl tabular-nums sm:text-4xl", accent ? "text-gold" : "text-bone")}>
        {display}
        <span className="text-xl">{suffix}</span>
      </p>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ash">{label}</p>
    </div>
  );
}

/* ---------------- fake halls ---------------- */

const HALL_OF_FAME = [
  { name: "OG_Hoof", held: "Since block one", bag: "14.2M $ANSEM", gain: "+$48,200", note: "Received airdrop. Never moved a token. Legend." },
  { name: "grandma_sol", held: "312 days", bag: "8.8M $ANSEM", gain: "+$29,600", note: "Doesn't know how to sell. We're not telling her." },
  { name: "bullmonk.sol", held: "289 days", bag: "5.1M $ANSEM", gain: "+$17,900", note: "Took a vow of diamond. Meditates on the chart." },
  { name: "line_holder", held: "245 days", bag: "3.3M $ANSEM", gain: "+$11,400", note: "Bought the dip. Then the dip's dip. Still here." },
];

const HALL_OF_SHAME = [
  { name: "kebab_enjoyer", sold: "2.1M $ANSEM", got: "one (1) kebab", missed: "-$7,300", note: "The kebab was reportedly mid." },
  { name: "sir_paperhands", sold: "900K $ANSEM", got: "$41 of gas fees", missed: "-$3,100", note: "Panic sold a -4% wick. A -4% wick." },
  { name: "wen_lambo_liu", sold: "5M $ANSEM", got: "a used e-scooter", missed: "-$17,000", note: "The scooter has since been stolen." },
];

/* ---------------- wallet-derived status (simulated) ---------------- */

function getWalletStatus(address: string) {
  const rand = seededRandom(hashString(address));
  const score = Math.floor(rand() * 100);
  const bag = Math.floor(rand() * 9_000_000) + 120_000;
  const days = Math.floor(rand() * 300) + 14;
  const gain = Math.floor(bag * 0.0042 * (0.6 + rand()));
  const tier =
    score > 75
      ? { label: "DIAMOND EMPEROR", emoji: "💎👑", color: "text-gold", desc: "You ARE the line others hold." }
      : score > 45
        ? { label: "DIAMOND HANDS", emoji: "💎🙌", color: "text-gold", desc: "Unshakeable. The herd salutes you." }
        : score > 20
          ? { label: "IRON GRIP", emoji: "🦾", color: "text-bone", desc: "Wobbled once. Held anyway. Respect." }
          : { label: "RECOVERING PAPERHAND", emoji: "🧻➡️💎", color: "text-crimson", desc: "We've all been there. Charge again." };
  return { score, bag, days, gain, tier };
}

/* ---------------- share-card generation ---------------- */

function generateStoryCard(name: string, story: string, tierLabel: string): string | null {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 675;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

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

  ctx.fillStyle = "#D4AF37";
  ctx.font = "900 44px Impact, sans-serif";
  ctx.fillText("MY DIAMOND HANDS STORY", 230, 125);
  ctx.fillStyle = "#8B8694";
  ctx.font = "700 22px monospace";
  ctx.fillText(`${name || "Anonymous Bull"} · ${tierLabel}`, 230, 165);

  // Wrap the story text
  ctx.fillStyle = "#EDE8DC";
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

  ctx.fillStyle = "#FF2E2E";
  ctx.font = "700 24px monospace";
  ctx.fillText("HOLD THE LINE — ansem.space", 80, 610);
  return canvas.toDataURL("image/png");
}

/* ---------------- section ---------------- */

export function Hands() {
  const { address, connect, connecting } = useWallet();
  const market = useMarket();
  const status = address ? getWalletStatus(address) : null;

  // "What if you held" calculator — held side uses the LIVE price.
  const [airdropAmount, setAirdropAmount] = useState(1_000_000);
  const heldValue = airdropAmount * market.price;
  const soldValue = airdropAmount * market.price * 0.074; // assumed early exit near launch price

  // Story modal
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyName, setStoryName] = useState("");
  const [storyText, setStoryText] = useState("");
  const [cardUrl, setCardUrl] = useState<string | null>(null);

  function makeCard() {
    if (!storyText.trim()) return;
    const url = generateStoryCard(storyName, storyText.trim(), status?.tier.label ?? "DIAMOND HANDS");
    setCardUrl(url);
    if (url) fireConfetti({ count: 80 });
  }

  return (
    <section id="hands" className="relative scroll-mt-16 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          kicker="Section 03 — Culture"
          title="Hands"
          sub="This coin runs on grip strength. Check the herd's stats, reveal your own status, and immortalize your diamond-hands story. Paperhands enter at their own risk."
        />

        {/* Live market stats via DexScreener */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile
            value={market.price}
            suffix=""
            label={market.live ? "Live price (DexScreener)" : "Price (connecting…)"}
            accent
            format={(v) => `$${v < 0.001 ? v.toFixed(7) : v.toFixed(5)}`}
          />
          <StatTile
            value={market.marketCap}
            suffix=""
            label="Market cap"
            format={(v) => formatUsd(v, 0)}
          />
          <StatTile
            value={market.volume24h}
            suffix=""
            label="24h volume"
            accent
            format={(v) => formatUsd(v, 0)}
          />
          <StatTile
            value={market.change24h}
            suffix="%"
            label="24h change"
            format={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}`}
          />
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {/* My Status */}
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
            {!address ? (
              <div className="mt-6 flex flex-col items-start gap-4">
                <p className="text-sm text-ash">
                  Connect your wallet to reveal your (highly scientific, fully simulated)
                  diamond-hand rating.
                </p>
                <Button onClick={connect} disabled={connecting}>
                  <Wallet size={15} /> {connecting ? "Connecting…" : "Connect Wallet"}
                </Button>
              </div>
            ) : status ? (
              <motion.div
                key={address}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-5"
              >
                <p className="text-4xl">{status.tier.emoji}</p>
                <p className={cn("mt-2 font-display text-2xl uppercase tracking-wide", status.tier.color)}>
                  {status.tier.label}
                </p>
                <p className="mt-1 text-sm text-ash">{status.tier.desc}</p>
                <dl className="mt-5 grid grid-cols-3 gap-3 font-mono text-xs">
                  <div className="border border-edge px-3 py-2.5">
                    <dt className="text-ash">Grip score</dt>
                    <dd className="mt-1 text-lg text-gold">{status.score}/100</dd>
                  </div>
                  <div className="border border-edge px-3 py-2.5">
                    <dt className="text-ash">Sim. bag</dt>
                    <dd className="mt-1 text-lg text-bone">{(status.bag / 1e6).toFixed(1)}M</dd>
                  </div>
                  <div className="border border-edge px-3 py-2.5">
                    <dt className="text-ash">Unrealized</dt>
                    <dd className="mt-1 text-lg text-gold">+{formatUsd(status.gain)}</dd>
                  </div>
                </dl>
                <p className="mt-3 font-mono text-[10px] text-ash">
                  {shortAddress(address, 6)} · simulated for fun, not real chain data
                </p>
                <Button
                  size="sm"
                  variant="crimson"
                  className="mt-4"
                  onClick={() =>
                    shareOnX(
                      `Just got rated ${status.tier.label} ${status.tier.emoji} on ansem.space with a ${status.score}/100 grip score. Check yours, paperhands:`
                    )
                  }
                >
                  <Share2 size={14} /> Flex status on X
                </Button>
              </motion.div>
            ) : null}

            {/* Calculator */}
            <div className="mt-8 border-t border-edge pt-6">
              <h4 className="font-display text-xs uppercase tracking-widest text-bone">
                What if you held from the airdrop?
              </h4>
              <label className="mt-3 block font-mono text-[10px] uppercase tracking-[0.2em] text-ash">
                Airdrop size: {(airdropAmount / 1e6).toFixed(1)}M $ANSEM
              </label>
              <input
                type="range"
                min={100000}
                max={20000000}
                step={100000}
                value={airdropAmount}
                onChange={(e) => setAirdropAmount(Number(e.target.value))}
                className="mt-2 w-full accent-gold"
              />
              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div className="border border-crimson/40 bg-crimson/5 px-3 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-crimson">Sold day one</p>
                  <p className="mt-1 font-display text-xl text-crimson">{formatUsd(soldValue)}</p>
                  <p className="mt-1 text-[10px] text-ash">…enjoy the kebab</p>
                </div>
                <div className="border border-gold/40 bg-gold/5 px-3 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-gold">Held the line</p>
                  <p className="mt-1 font-display text-xl text-gold">{formatUsd(heldValue)}</p>
                  <p className="mt-1 text-[10px] text-ash">{(heldValue / Math.max(soldValue, 0.01)).toFixed(1)}x the paper path</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Halls */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
            <div className="border border-edge bg-panel p-6 shadow-panel [clip-path:polygon(14px_0,100%_0,100%_calc(100%-14px),calc(100%-14px)_100%,0_100%,0_14px)]">
              <h3 className="font-display text-sm uppercase tracking-widest text-gold">
                💎 Hall of Fame — Diamond Division
              </h3>
              <div className="mt-4 space-y-3">
                {HALL_OF_FAME.map((h) => (
                  <div key={h.name} className="flex items-start justify-between gap-3 border-b border-edge/50 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-mono text-xs text-bone">@{h.name}</p>
                      <p className="mt-0.5 text-[11px] text-ash">{h.note}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-ash">{h.held} · {h.bag}</p>
                    </div>
                    <span className="shrink-0 font-mono text-xs text-gold">{h.gain}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-crimson/30 bg-panel p-6 shadow-panel [clip-path:polygon(14px_0,100%_0,100%_calc(100%-14px),calc(100%-14px)_100%,0_100%,0_14px)]">
              <h3 className="font-display text-sm uppercase tracking-widest text-crimson">
                🧻 Hall of Shame — Paperhand Memorial
              </h3>
              <p className="mt-1 text-[11px] text-ash">Gone, but not forgotten. Mostly forgotten.</p>
              <div className="mt-4 space-y-3">
                {HALL_OF_SHAME.map((h) => (
                  <div key={h.name} className="flex items-start justify-between gap-3 border-b border-edge/50 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-mono text-xs text-bone">@{h.name}</p>
                      <p className="mt-0.5 text-[11px] text-ash">
                        Sold {h.sold} for {h.got}. {h.note}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-xs text-crimson">{h.missed}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button size="lg" className="w-full" onClick={() => { setCardUrl(null); setStoryOpen(true); }}>
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
                onClick={() => shareOnX(`My diamond hands story 💎🙌 "${storyText.slice(0, 120)}" — forged at`) }
              >
                <Share2 size={14} /> Share to X
              </Button>
            </div>
            <button onClick={() => setCardUrl(null)} className="w-full text-center font-mono text-xs text-ash hover:text-bone">
              ← Edit story
            </button>
          </div>
        )}
      </Dialog>
    </section>
  );
}
