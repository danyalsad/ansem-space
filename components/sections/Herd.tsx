"use client";

/**
 * SECTION — HERD (Gamification hub)
 * All-time + weekly leaderboards, the player's profile card, ways to earn,
 * and the full badge collection. Local competitors are simulated; the UI is
 * structured so a server-backed board can drop in later.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Award, Crown, Flame, TrendingUp, Wallet } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { useHerd } from "@/components/HerdProvider";
import { useWallet } from "@/components/WalletProvider";
import { BADGES, FAKE_HERD, weekKey } from "@/lib/points";
import { cn, shortAddress } from "@/lib/utils";

const EARN_METHODS = [
  { emoji: "🎮", label: "Play Charge", detail: "score ÷ 50 HP per run (max 400)" },
  { emoji: "🔥", label: "Post a meme to the gallery", detail: "+50 HP" },
  { emoji: "👍", label: "Upvote community memes", detail: "+5 HP each" },
  { emoji: "📜", label: "Complete Story Mode in Lore", detail: "+100 HP first time" },
  { emoji: "📅", label: "Daily login bonus", detail: "+25 HP, up to +50 with streak" },
  { emoji: "🔮", label: "Cast an Intel prediction", detail: "+20 HP" },
];

export function Herd() {
  const { address, connect } = useWallet();
  const { data, weeklyPoints, rank, weeklyRank } = useHerd();
  const [tab, setTab] = useState<"total" | "weekly">("total");

  const youName = address ? shortAddress(address) : "You (guest)";
  const board = [
    ...FAKE_HERD,
    { name: youName, total: data.total, weekly: weeklyPoints, isYou: true },
  ]
    .sort((a, b) => (tab === "total" ? b.total - a.total : b.weekly - a.weekly))
    .slice(0, 12);

  return (
    <section id="herd" className="relative scroll-mt-16 border-t border-edge/50 bg-abyss/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          kicker="Gamification — Herd Points"
          title="The Herd"
          sub="Everything you do here earns Herd Points (HP) tied to your wallet. Climb the board, collect badges, defend your rank. The herd remembers who showed up."
        />

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="border border-edge bg-panel shadow-panel [clip-path:polygon(14px_0,100%_0,100%_calc(100%-14px),calc(100%-14px)_100%,0_100%,0_14px)]"
          >
            <div className="flex items-center justify-between border-b border-edge px-5 py-4">
              <h3 className="flex items-center gap-2 font-display text-sm uppercase tracking-widest text-gold">
                <Crown size={16} /> Leaderboard
              </h3>
              <div className="flex border border-edge">
                {(["total", "weekly"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setTab(m)}
                    className={cn(
                      "px-4 py-1.5 font-display text-[10px] uppercase tracking-wider transition-colors",
                      tab === m ? "bg-gold/15 text-gold" : "text-ash hover:text-bone"
                    )}
                  >
                    {m === "total" ? "All-time" : `Weekly · ${weekKey().split("-")[1]}`}
                  </button>
                ))}
              </div>
            </div>

            <ol>
              {board.map((entry, i) => {
                const pts = tab === "total" ? entry.total : entry.weekly;
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
                return (
                  <motion.li
                    key={entry.name}
                    layout
                    className={cn(
                      "flex items-center justify-between gap-3 border-b border-edge/40 px-5 py-3 last:border-0",
                      entry.isYou && "bg-gold/10"
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className={cn("w-7 shrink-0 text-right font-mono text-xs", i < 3 ? "text-gold" : "text-ash")}>
                        {medal ?? i + 1}
                      </span>
                      <span
                        className={cn(
                          "truncate font-mono text-xs",
                          entry.isYou ? "font-bold text-gold" : "text-bone"
                        )}
                      >
                        {entry.name}
                        {entry.isYou && " ← you"}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-ash">
                      {pts.toLocaleString()} <span className="text-gold/60">HP</span>
                    </span>
                  </motion.li>
                );
              })}
            </ol>
            <p className="px-5 py-3 font-mono text-[10px] text-ash/70">
              Local leaderboard (simulated competitors) — global on-chain board coming soon.
            </p>
          </motion.div>

          {/* Profile + earn + badges */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Profile card */}
            <div className="border border-gold/30 bg-panel p-5 shadow-panel [clip-path:polygon(14px_0,100%_0,100%_calc(100%-14px),calc(100%-14px)_100%,0_100%,0_14px)]">
              <h3 className="flex items-center gap-2 font-display text-sm uppercase tracking-widest text-gold">
                <TrendingUp size={15} /> Your standing
              </h3>
              {!address && (
                <div className="mt-3">
                  <p className="text-xs text-ash">
                    Earning as guest — connect to bind your points to your wallet.
                  </p>
                  <Button size="sm" className="mt-3" onClick={connect}>
                    <Wallet size={13} /> Connect wallet
                  </Button>
                </div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div className="border border-edge px-2 py-3">
                  <p className="font-display text-2xl text-gold">{data.total.toLocaleString()}</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-ash">Total HP · #{rank}</p>
                </div>
                <div className="border border-edge px-2 py-3">
                  <p className="font-display text-2xl text-bone">{weeklyPoints.toLocaleString()}</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-ash">This week · #{weeklyRank}</p>
                </div>
              </div>
              <p className="mt-3 flex items-center gap-2 font-mono text-[11px] text-ash">
                <Flame size={12} className="text-crimson-bright" />
                Login streak: <span className="text-gold">{data.streak} day{data.streak === 1 ? "" : "s"}</span>
                {data.lastDaily === new Date().toISOString().slice(0, 10) && " · today's bonus claimed ✓"}
              </p>
            </div>

            {/* How to earn */}
            <div className="border border-edge bg-panel p-5 shadow-panel [clip-path:polygon(14px_0,100%_0,100%_calc(100%-14px),calc(100%-14px)_100%,0_100%,0_14px)]">
              <h3 className="font-display text-sm uppercase tracking-widest text-bone">Ways to earn</h3>
              <ul className="mt-3 space-y-2.5">
                {EARN_METHODS.map((m) => (
                  <li key={m.label} className="flex items-start gap-2.5 text-xs">
                    <span>{m.emoji}</span>
                    <span className="text-bone">
                      {m.label} <span className="text-ash">— {m.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Badges */}
            <div className="border border-edge bg-panel p-5 shadow-panel [clip-path:polygon(14px_0,100%_0,100%_calc(100%-14px),calc(100%-14px)_100%,0_100%,0_14px)]">
              <h3 className="flex items-center gap-2 font-display text-sm uppercase tracking-widest text-bone">
                <Award size={15} /> Badges · {data.badges.length}/{BADGES.length}
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {BADGES.map((b) => {
                  const earned = data.badges.includes(b.id);
                  return (
                    <div
                      key={b.id}
                      title={b.desc}
                      className={cn(
                        "border px-3 py-2.5 transition-all",
                        earned ? "border-gold/50 bg-gold/10" : "border-edge opacity-45"
                      )}
                    >
                      <p className="text-lg">{b.emoji}</p>
                      <p className={cn("mt-1 font-display text-[10px] uppercase tracking-wide", earned ? "text-gold" : "text-ash")}>
                        {b.name}
                      </p>
                      <p className="mt-0.5 text-[9px] leading-tight text-ash">{b.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
