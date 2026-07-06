/**
 * Herd Points — the gamification engine.
 *
 * Points are persisted in localStorage, keyed by the connected wallet
 * address (or "guest" before connecting; guest progress is merged into the
 * wallet profile on first connect). All reads/writes go through this module
 * so a future server-backed leaderboard only has to swap these functions.
 */

import { store } from "@/lib/utils";

export type EarnAction = "game" | "meme_post" | "upvote" | "story" | "daily" | "intel";

export interface PlayerCounters {
  games: number;
  bestScore: number;
  memes: number;
  upvotes: number;
  story: number;
  intel: number;
  dailies: number;
}

export interface PlayerData {
  total: number;
  /** points per ISO week, e.g. { "2026-W28": 340 } */
  weekly: Record<string, number>;
  badges: string[];
  streak: number;
  lastDaily: string; // yyyy-mm-dd of last daily bonus
  counters: PlayerCounters;
}

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  earned: (d: PlayerData) => boolean;
}

export const BADGES: Badge[] = [
  { id: "first-blood", name: "First Blood", emoji: "🩸", desc: "Earn your first Herd Points", earned: (d) => d.total > 0 },
  { id: "meme-lord", name: "Meme Lord", emoji: "👑", desc: "Post 3 memes to the gallery", earned: (d) => d.counters.memes >= 3 },
  { id: "bull-runner", name: "Bull Runner", emoji: "🏃", desc: "Score 5,000+ in Charge", earned: (d) => d.counters.bestScore >= 5000 },
  { id: "lore-keeper", name: "Lore Keeper", emoji: "📜", desc: "Complete Story Mode in Lore", earned: (d) => d.counters.story >= 1 },
  { id: "diamond-hands", name: "Diamond Hands", emoji: "💎", desc: "Collect 5 daily login bonuses", earned: (d) => d.counters.dailies >= 5 },
  { id: "herd-voice", name: "Voice of the Herd", emoji: "📢", desc: "Upvote 10 community memes", earned: (d) => d.counters.upvotes >= 10 },
  { id: "oracle", name: "Oracle", emoji: "🔮", desc: "Use the Intel prediction tools", earned: (d) => d.counters.intel >= 1 },
  { id: "grinder", name: "Certified Grinder", emoji: "⚒️", desc: "Reach 1,000 total Herd Points", earned: (d) => d.total >= 1000 },
];

/** Fixed point values (game points are score-derived). */
export const POINT_VALUES: Record<Exclude<EarnAction, "game" | "daily">, number> = {
  meme_post: 50,
  upvote: 5,
  story: 100,
  intel: 20,
};

const EMPTY: PlayerData = {
  total: 0,
  weekly: {},
  badges: [],
  streak: 0,
  lastDaily: "",
  counters: { games: 0, bestScore: 0, memes: 0, upvotes: 0, story: 0, intel: 0, dailies: 0 },
};

export function playerKey(address: string | null): string {
  return `ansem_herd_${address ?? "guest"}`;
}

export function weekKey(date = new Date()): string {
  // ISO week number
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function loadPlayer(address: string | null): PlayerData {
  const raw = store.get<PlayerData | null>(playerKey(address), null);
  if (!raw) return structuredClone(EMPTY);
  return { ...structuredClone(EMPTY), ...raw, counters: { ...EMPTY.counters, ...raw.counters } };
}

function savePlayer(address: string | null, data: PlayerData) {
  store.set(playerKey(address), data);
}

export interface EarnResult {
  gained: number;
  newBadges: Badge[];
  data: PlayerData;
  label: string;
}

/**
 * Award points for an action. Reads latest state from storage (so double
 * invocations — e.g. React StrictMode — can't double-claim dailies).
 */
export function awardPoints(
  address: string | null,
  action: EarnAction,
  meta: { score?: number } = {}
): EarnResult {
  const data = loadPlayer(address);
  const today = new Date().toISOString().slice(0, 10);
  let gained = 0;
  let label = "";

  switch (action) {
    case "game": {
      const score = meta.score ?? 0;
      gained = Math.min(400, Math.max(10, Math.floor(score / 50)));
      data.counters.games += 1;
      data.counters.bestScore = Math.max(data.counters.bestScore, score);
      label = "Charge run";
      break;
    }
    case "meme_post":
      gained = POINT_VALUES.meme_post;
      data.counters.memes += 1;
      label = "Meme posted";
      break;
    case "upvote":
      gained = POINT_VALUES.upvote;
      data.counters.upvotes += 1;
      label = "Upvote";
      break;
    case "story":
      // Full reward once; small repeat reward after.
      gained = data.counters.story === 0 ? POINT_VALUES.story : 20;
      data.counters.story += 1;
      label = "Story Mode complete";
      break;
    case "intel":
      gained = POINT_VALUES.intel;
      data.counters.intel += 1;
      label = "Intel used";
      break;
    case "daily": {
      if (data.lastDaily === today) return { gained: 0, newBadges: [], data, label: "" };
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      data.streak = data.lastDaily === yesterday ? data.streak + 1 : 1;
      data.lastDaily = today;
      data.counters.dailies += 1;
      gained = 25 + Math.min(data.streak - 1, 5) * 5; // 25 → 50 with streak
      label = `Daily bonus · day ${data.streak}`;
      break;
    }
  }

  data.total += gained;
  const wk = weekKey();
  data.weekly[wk] = (data.weekly[wk] ?? 0) + gained;

  // Badge checks
  const newBadges = BADGES.filter((b) => !data.badges.includes(b.id) && b.earned(data));
  data.badges.push(...newBadges.map((b) => b.id));

  savePlayer(address, data);
  return { gained, newBadges, data, label };
}

/** Merge pre-connect guest progress into the wallet profile (runs once). */
export function mergeGuestInto(address: string) {
  const guest = store.get<PlayerData | null>(playerKey(null), null);
  if (!guest || guest.total === 0) return;
  const target = loadPlayer(address);
  target.total += guest.total;
  for (const [wk, pts] of Object.entries(guest.weekly)) {
    target.weekly[wk] = (target.weekly[wk] ?? 0) + pts;
  }
  for (const k of Object.keys(target.counters) as Array<keyof PlayerCounters>) {
    target.counters[k] = k === "bestScore"
      ? Math.max(target.counters[k], guest.counters[k] ?? 0)
      : target.counters[k] + (guest.counters[k] ?? 0);
  }
  target.streak = Math.max(target.streak, guest.streak);
  target.lastDaily = target.lastDaily || guest.lastDaily;
  target.badges = Array.from(new Set([...target.badges, ...guest.badges]));
  savePlayer(address, target);
  store.remove(playerKey(null));
}

/* ------------------------------------------------------------------ */
/* Simulated competitors so the leaderboard feels alive from day one.   */
/* Replace with a server-backed board later without touching the UI.    */
/* ------------------------------------------------------------------ */

export interface HerdEntry {
  name: string;
  total: number;
  weekly: number;
  isYou?: boolean;
}

export const FAKE_HERD: HerdEntry[] = [
  { name: "blknoiz_disciple", total: 14820, weekly: 980 },
  { name: "HoofDaddy", total: 12140, weekly: 1240 },
  { name: "solana_stampede", total: 9860, weekly: 640 },
  { name: "grandma_sol", total: 8420, weekly: 310 },
  { name: "bullmonk.sol", total: 7150, weekly: 890 },
  { name: "line_holder", total: 5930, weekly: 470 },
  { name: "wagmi_wanda", total: 4480, weekly: 720 },
  { name: "bearhunter.sol", total: 3120, weekly: 260 },
  { name: "kebab_regret", total: 1870, weekly: 150 },
  { name: "fresh_hoof", total: 640, weekly: 90 },
];

export function computeRank(total: number, mode: "total" | "weekly" = "total", weekly = 0): number {
  const mine = mode === "total" ? total : weekly;
  return 1 + FAKE_HERD.filter((e) => (mode === "total" ? e.total : e.weekly) > mine).length;
}
