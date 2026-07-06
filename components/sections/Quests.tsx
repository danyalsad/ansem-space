"use client";

/**
 * SECTION — QUESTS (Retention hub)
 * Daily + weekly quests, referral program, streak milestones.
 */

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Flame, Gift, Target, Users } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { AchievementRoadmap } from "@/components/AchievementRoadmap";
import { Button } from "@/components/ui/button";
import { useHerd } from "@/components/HerdProvider";
import { useWallet } from "@/components/WalletProvider";
import { CREATOR_TAGLINE } from "@/lib/constants";
import { fireConfetti } from "@/lib/confetti";
import { loadPlayer, savePlayerDirect, BADGES } from "@/lib/points";
import {
  claimQuest,
  getQuestState,
  type QuestPeriod,
} from "@/lib/quests";
import {
  REFERRAL_TIERS,
  claimReferralTier,
  loadReferralData,
  referralLink,
  captureReferralFromUrl,
} from "@/lib/referrals";
import { cn } from "@/lib/utils";

export function Quests() {
  const { address, connect } = useWallet();
  const { data } = useHerd();
  const [tab, setTab] = useState<QuestPeriod>("daily");
  const [quests, setQuests] = useState(() => getQuestState(null));
  const [copied, setCopied] = useState(false);
  const refData = address ? loadReferralData(address) : null;

  const refresh = useCallback(() => {
    setQuests(getQuestState(address));
  }, [address]);

  useEffect(() => {
    refresh();
  }, [refresh, data.total]);

  // Process referral from URL on wallet connect
  useEffect(() => {
    if (!address) return;
    const code = captureReferralFromUrl();
    if (!code) return;
    fetch("/api/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referee: address, referrerCode: code }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          refresh();
          fireConfetti({ count: 80 });
        }
      })
      .catch(() => {});
  }, [address, refresh]);

  function onClaim(questId: string) {
    const result = claimQuest(address, questId);
    if (!result) return;
    const player = loadPlayer(address);
    const newBadges = BADGES.filter((b) => !player.badges.includes(b.id) && b.earned(player));
    player.badges.push(...newBadges.map((b) => b.id));
    savePlayerDirect(address, player);
    refresh();
    fireConfetti({ count: result.gained >= 200 ? 120 : 60 });
  }

  function onClaimReferralTier(tier: number) {
    if (!address) return;
    const result = claimReferralTier(address, tier);
    if (!result) return;
    refresh();
    fireConfetti({ count: 100 });
  }

  const filtered = quests.filter((q) => q.quest.period === tab);
  const dailyComplete = quests.filter((q) => q.quest.period === "daily" && q.complete).length;
  const weeklyComplete = quests.filter((q) => q.quest.period === "weekly" && q.complete).length;

  return (
    <section id="quests" className="section-shell">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          kicker="Daily missions"
          title="Bull Quests"
          sub="Complete daily and weekly missions to stack Herd Points, unlock badges, and climb the board."
        />

        <p className="-mt-8 mb-10 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-gold/70">
          {CREATOR_TAGLINE}
        </p>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Quest list */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="border border-edge bg-panel shadow-panel [clip-path:polygon(14px_0,100%_0,100%_calc(100%-14px),calc(100%-14px)_100%,0_100%,0_14px)]"
          >
            <div className="flex items-center justify-between border-b border-edge px-5 py-4">
              <h3 className="flex items-center gap-2 font-display text-sm uppercase tracking-widest text-gold">
                <Target size={16} /> Active quests
              </h3>
              <div className="flex border border-edge">
                {(["daily", "weekly"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setTab(p)}
                    className={cn(
                      "px-4 py-1.5 font-display text-[10px] uppercase tracking-wider transition-colors",
                      tab === p ? "bg-gold/15 text-gold" : "text-ash hover:text-bone"
                    )}
                  >
                    {p} · {p === "daily" ? dailyComplete : weeklyComplete}/{p === "daily" ? 5 : 5}
                  </button>
                ))}
              </div>
            </div>

            <ul className="divide-y divide-edge/40">
              {filtered.map(({ quest, count, complete, claimed }) => (
                <li key={quest.id} className="flex items-center gap-4 px-5 py-4">
                  <span className="text-2xl">{quest.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-xs uppercase tracking-wide text-bone">{quest.title}</p>
                    <p className="text-[11px] text-ash">{quest.desc}</p>
                    <div className="mt-2 h-1.5 overflow-hidden bg-void">
                      <div
                        className={cn("h-full transition-all", complete ? "bg-gold" : "bg-gold/40")}
                        style={{ width: `${Math.min(100, (count / quest.target) * 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 font-mono text-[9px] text-ash">
                      {Math.min(count, quest.target)}/{quest.target}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-xs text-gold">+{quest.reward} HP</p>
                    {claimed ? (
                      <span className="mt-1 flex items-center justify-end gap-1 font-mono text-[9px] text-gold">
                        <Check size={10} /> Claimed
                      </span>
                    ) : complete ? (
                      <Button size="sm" className="mt-2" onClick={() => onClaim(quest.id)}>
                        <Gift size={12} /> Claim
                      </Button>
                    ) : (
                      <span className="mt-1 block font-mono text-[9px] text-ash">In progress</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Sidebar: streak + referrals + roadmap */}
          <div className="space-y-6">
            {/* Streak card */}
            <div className="border border-gold/30 bg-panel p-5 shadow-panel">
              <h3 className="flex items-center gap-2 font-display text-sm uppercase tracking-widest text-crimson">
                <Flame size={15} /> Login streak
              </h3>
              <p className="mt-3 font-display text-4xl text-gold">{data.streak}</p>
              <p className="mt-1 text-xs text-ash">days · escalating daily bonus up to +70 HP</p>
              <ul className="mt-4 space-y-1.5 text-[10px] text-ash">
                <li className={data.streak >= 7 ? "text-gold" : ""}>Day 7 → +100 HP milestone bonus</li>
                <li className={data.streak >= 14 ? "text-gold" : ""}>Day 14 → +200 HP milestone bonus</li>
                <li className={data.streak >= 30 ? "text-gold" : ""}>Day 30 → +500 HP milestone bonus</li>
              </ul>
            </div>

            {/* Referral program */}
            <div className="border border-edge bg-panel p-5 shadow-panel">
              <h3 className="flex items-center gap-2 font-display text-sm uppercase tracking-widest text-bone">
                <Users size={15} /> Recruit the herd
              </h3>
              {!address ? (
                <div className="mt-3">
                  <p className="text-xs text-ash">Connect wallet to get your referral link.</p>
                  <Button size="sm" className="mt-3" onClick={connect}>
                    Connect wallet
                  </Button>
                </div>
              ) : (
                <>
                  <p className="mt-2 text-xs text-ash">
                    Invite friends — you earn +75 HP per recruit, they get +50 HP on signup.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <input
                      readOnly
                      value={referralLink(address)}
                      className="min-w-0 flex-1 border border-edge bg-void px-3 py-2 font-mono text-[10px] text-bone"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await navigator.clipboard.writeText(referralLink(address));
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      }}
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                    </Button>
                  </div>
                  <p className="mt-2 font-mono text-[10px] text-gold">
                    Recruits: {refData?.recruits.length ?? 0}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {REFERRAL_TIERS.map((t) => {
                      const recruits = refData?.recruits.length ?? 0;
                      const claimed = refData?.tiersClaimed.includes(t.count) ?? false;
                      const ready = recruits >= t.count && !claimed;
                      return (
                        <li key={t.count} className="flex items-center justify-between text-xs">
                          <span className={recruits >= t.count ? "text-bone" : "text-ash"}>
                            {t.count} recruits — {t.label}
                          </span>
                          {claimed ? (
                            <span className="font-mono text-[9px] text-gold">✓ +{t.reward}</span>
                          ) : ready ? (
                            <button
                              onClick={() => onClaimReferralTier(t.count)}
                              className="font-mono text-[9px] uppercase text-gold hover:text-gold-glow"
                            >
                              Claim +{t.reward}
                            </button>
                          ) : (
                            <span className="font-mono text-[9px] text-ash">+{t.reward} HP</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>

            <AchievementRoadmap />
          </div>
        </div>
      </div>
    </section>
  );
}