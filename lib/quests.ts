/**
 * Daily & weekly quest engine — progress tracked per wallet/guest,
 * rewards claimed manually from the Quests hub.
 */

import {
  loadPlayer,
  savePlayerDirect,
  weekKey,
  type PlayerData,
  type QuestProgress,
} from "@/lib/points";
import { store } from "@/lib/utils";

export type QuestPeriod = "daily" | "weekly";
export type QuestTrigger = "game" | "meme_post" | "upvote" | "intel" | "share" | "daily" | "quest_claim";

export interface QuestDef {
  id: string;
  period: QuestPeriod;
  title: string;
  desc: string;
  emoji: string;
  target: number;
  reward: number;
  triggers: QuestTrigger[];
}

const DAILY_KEY = () => new Date().toISOString().slice(0, 10);
const WEEKLY_KEY = () => weekKey();

export const QUESTS: QuestDef[] = [
  // ── Daily ──
  {
    id: "daily-runs-3",
    period: "daily",
    title: "Charge Forward",
    desc: "Complete 3 Charge runs",
    emoji: "🏃",
    target: 3,
    reward: 75,
    triggers: ["game"],
  },
  {
    id: "daily-meme-1",
    period: "daily",
    title: "Forge One",
    desc: "Post 1 meme to the gallery",
    emoji: "🔥",
    target: 1,
    reward: 60,
    triggers: ["meme_post"],
  },
  {
    id: "daily-vote-2",
    period: "daily",
    title: "Herd Voice",
    desc: "Upvote 2 community memes",
    emoji: "👍",
    target: 2,
    reward: 30,
    triggers: ["upvote"],
  },
  {
    id: "daily-poll-1",
    period: "daily",
    title: "Oracle's Call",
    desc: "Cast a prediction in Intel",
    emoji: "🔮",
    target: 1,
    reward: 25,
    triggers: ["intel"],
  },
  {
    id: "daily-share-1",
    period: "daily",
    title: "Spread the Bull",
    desc: "Share your creation on X",
    emoji: "𝕏",
    target: 1,
    reward: 40,
    triggers: ["share"],
  },
  // ── Weekly ──
  {
    id: "weekly-memes-5",
    period: "weekly",
    title: "Meme Machine",
    desc: "Post 5 memes this week",
    emoji: "👑",
    target: 5,
    reward: 200,
    triggers: ["meme_post"],
  },
  {
    id: "weekly-runs-15",
    period: "weekly",
    title: "Stampede Runner",
    desc: "Complete 15 Charge runs",
    emoji: "⚡",
    target: 15,
    reward: 150,
    triggers: ["game"],
  },
  {
    id: "weekly-votes-10",
    period: "weekly",
    title: "Gallery Curator",
    desc: "Upvote 10 memes",
    emoji: "🖼️",
    target: 10,
    reward: 100,
    triggers: ["upvote"],
  },
  {
    id: "weekly-streak-5",
    period: "weekly",
    title: "Diamond Routine",
    desc: "Reach a 5-day login streak",
    emoji: "💎",
    target: 5,
    reward: 250,
    triggers: ["daily"],
  },
  {
    id: "weekly-quests-5",
    period: "weekly",
    title: "Quest Crusher",
    desc: "Claim 5 daily quest rewards",
    emoji: "🎯",
    target: 5,
    reward: 300,
    triggers: ["quest_claim"],
  },
];

function periodKeyFor(quest: QuestDef): string {
  return quest.period === "daily" ? DAILY_KEY() : WEEKLY_KEY();
}

function ensureQuests(data: PlayerData): Record<string, QuestProgress> {
  if (!data.quests) data.quests = {};
  return data.quests;
}

/** Reset stale quest rows when the day/week rolls over. */
export function normalizeQuests(data: PlayerData): PlayerData {
  const quests = ensureQuests(data);
  for (const q of QUESTS) {
    const pk = periodKeyFor(q);
    const cur = quests[q.id];
    if (!cur || cur.periodKey !== pk) {
      quests[q.id] = { count: 0, claimed: false, periodKey: pk };
    }
  }
  // Streak quest reads live streak, not counter
  const streakQ = quests["weekly-streak-5"];
  if (streakQ) streakQ.count = Math.min(data.streak, 5);
  return data;
}

export function getQuestState(address: string | null) {
  const data = normalizeQuests(loadPlayer(address));
  savePlayerDirect(address, data);
  return QUESTS.map((q) => {
    const p = data.quests![q.id];
    const count = q.id === "weekly-streak-5" ? data.streak : p.count;
    const complete = count >= q.target;
    return { quest: q, count, complete, claimed: p.claimed, periodKey: p.periodKey };
  });
}

/** Bump quest counters after a player action. */
export function trackQuestAction(address: string | null, trigger: QuestTrigger) {
  const data = normalizeQuests(loadPlayer(address));
  let changed = false;

  for (const q of QUESTS) {
    if (!q.triggers.includes(trigger)) continue;
    const p = data.quests![q.id];
    if (q.id === "weekly-streak-5") {
      p.count = data.streak;
      changed = true;
      continue;
    }
    if (p.claimed) continue;
    p.count = Math.min(q.target, p.count + 1);
    changed = true;
  }

  if (changed) savePlayerDirect(address, data);
  return data;
}

export interface ClaimResult {
  gained: number;
  questId: string;
  label: string;
}

/** Claim a completed quest reward. Returns null if not claimable. */
export function claimQuest(address: string | null, questId: string): ClaimResult | null {
  const def = QUESTS.find((q) => q.id === questId);
  if (!def) return null;

  const data = normalizeQuests(loadPlayer(address));
  const p = data.quests![questId];
  const count = questId === "weekly-streak-5" ? data.streak : p.count;
  if (p.claimed || count < def.target) return null;

  p.claimed = true;
  data.total += def.reward;
  const wk = weekKey();
  data.weekly[wk] = (data.weekly[wk] ?? 0) + def.reward;
  data.counters.questsClaimed = (data.counters.questsClaimed ?? 0) + 1;

  // Progress the weekly "claim 5 daily quests" counter
  if (def.period === "daily") {
    const wq = data.quests!["weekly-quests-5"];
    if (wq && !wq.claimed) {
      wq.count = Math.min(5, wq.count + 1);
    }
  }

  savePlayerDirect(address, data);
  return { gained: def.reward, questId, label: `Quest: ${def.title}` };
}

/** Charge daily challenge completion — marks claimed; caller applies HP via grantBonus. */
export function claimDailyChallenge(address: string | null): ClaimResult | null {
  const key = `challenge-${new Date().toISOString().slice(0, 10)}`;
  const claimed = store.get<string[]>("ansem_challenges_claimed", []);
  if (claimed.includes(key)) return null;
  store.set("ansem_challenges_claimed", [...claimed, key]);
  return { gained: 50, questId: "daily-challenge", label: "Daily challenge" };
}