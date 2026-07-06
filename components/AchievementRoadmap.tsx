"use client";

import { motion } from "framer-motion";
import { BADGES } from "@/lib/points";
import { cn } from "@/lib/utils";
import { useHerd } from "@/components/HerdProvider";

const HP_MILESTONES = [
  { hp: 0, label: "Rookie", emoji: "🐣" },
  { hp: 100, label: "Grinder", emoji: "⚒️" },
  { hp: 500, label: "Soldier", emoji: "🛡️" },
  { hp: 1000, label: "Veteran", emoji: "⭐" },
  { hp: 2500, label: "Elite", emoji: "💫" },
  { hp: 5000, label: "Legend", emoji: "🐂" },
];

export function AchievementRoadmap() {
  const { data } = useHerd();
  const maxHp = HP_MILESTONES[HP_MILESTONES.length - 1].hp;
  const progress = Math.min(100, (data.total / maxHp) * 100);
  const earnedCount = data.badges.length;

  return (
    <div className="border border-edge bg-panel p-5 shadow-panel [clip-path:polygon(14px_0,100%_0,100%_calc(100%-14px),calc(100%-14px)_100%,0_100%,0_14px)]">
      <h3 className="font-display text-sm uppercase tracking-widest text-gold">
        Achievement Roadmap
      </h3>
      <p className="mt-1 text-xs text-ash">
        {earnedCount}/{BADGES.length} badges · {data.total.toLocaleString()} HP earned
      </p>

      {/* HP progress bar */}
      <div className="relative mt-5 h-2 overflow-hidden bg-void">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-crimson via-gold to-gold-glow"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>

      <div className="mt-4 flex justify-between">
        {HP_MILESTONES.map((m) => {
          const reached = data.total >= m.hp;
          return (
            <div key={m.hp} className="flex flex-col items-center gap-1">
              <span className={cn("text-lg transition-all", reached ? "opacity-100" : "opacity-25 grayscale")}>
                {m.emoji}
              </span>
              <span className={cn("font-mono text-[8px] uppercase", reached ? "text-gold" : "text-ash/50")}>
                {m.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Badge track */}
      <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {BADGES.map((b) => {
          const earned = data.badges.includes(b.id);
          const progressPct = earned ? 100 : b.earned(data) ? 100 : estimateProgress(b.id, data);
          return (
            <div
              key={b.id}
              title={b.desc}
              className={cn(
                "relative overflow-hidden border px-2 py-2 text-center",
                earned ? "border-gold/40 bg-gold/10" : "border-edge/60 bg-void/40"
              )}
            >
              <div
                className="absolute inset-x-0 bottom-0 bg-gold/20 transition-all"
                style={{ height: `${progressPct}%` }}
              />
              <span className="relative text-base">{b.emoji}</span>
              <p className={cn("relative mt-0.5 font-mono text-[7px] uppercase leading-tight", earned ? "text-gold" : "text-ash")}>
                {b.name}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function estimateProgress(badgeId: string, data: ReturnType<typeof useHerd>["data"]): number {
  const c = data.counters;
  switch (badgeId) {
    case "meme-lord": return Math.min(100, (c.memes / 3) * 100);
    case "bull-runner": return Math.min(100, (c.bestScore / 5000) * 100);
    case "diamond-hands": return Math.min(100, (c.dailies / 5) * 100);
    case "herd-voice": return Math.min(100, (c.upvotes / 10) * 100);
    case "grinder": return Math.min(100, (data.total / 1000) * 100);
    case "streak-warrior": return Math.min(100, (data.streak / 7) * 100);
    case "quest-master": return Math.min(100, ((c.questsClaimed ?? 0) / 10) * 100);
    case "herd-recruiter": return Math.min(100, ((c.referrals ?? 0) / 3) * 100);
    case "bull-legend": return Math.min(100, (data.total / 5000) * 100);
    case "meme-champion": return Math.min(100, (c.memes / 10) * 100);
    case "share-bull": return Math.min(100, ((c.shares ?? 0) / 5) * 100);
    default: return data.total > 0 ? 30 : 0;
  }
}