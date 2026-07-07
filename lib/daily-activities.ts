/** Once-per-day onsite activities (spin, GM stamp, riddle). */

import { store } from "@/lib/utils";

const DAY = () => new Date().toISOString().slice(0, 10);
const KEY = "ansem_daily_acts";

export type DailyActivityId = "spin" | "gm" | "riddle";

export function dailyDone(id: DailyActivityId): boolean {
  const map = store.get<Record<string, string>>(KEY, {});
  return map[id] === DAY();
}

export function markDaily(id: DailyActivityId) {
  const map = store.get<Record<string, string>>(KEY, {});
  store.set(KEY, { ...map, [id]: DAY() });
}

export function loadDailyState(): Record<DailyActivityId, boolean> {
  return {
    spin: dailyDone("spin"),
    gm: dailyDone("gm"),
    riddle: dailyDone("riddle"),
  };
}

const RIDDLES: { q: string; choices: string[]; answer: number }[] = [
  { q: "What chain does $ANSEM run on?", choices: ["Ethereum", "Solana", "Bitcoin"], answer: 1 },
  { q: "Paper hands do what?", choices: ["Hold forever", "Sell too early", "Mint NFTs"], answer: 1 },
  { q: "The Black Bull mascot color?", choices: ["Neon green", "Gold & crimson", "Baby blue"], answer: 1 },
  { q: "Best move in a bear market?", choices: ["Panic sell", "Hold the line", "Delete wallet"], answer: 1 },
  { q: "Where do herd memes get forged?", choices: ["The Forge", "The Void", "Mars"], answer: 0 },
  { q: "Diamond hands emoji?", choices: ["🧻", "💎", "🐻"], answer: 1 },
  { q: "ANSEM Space tagline ends with…", choices: ["Hold the Line", "Buy the top", "Exit liquidity"], answer: 0 },
];

export function getDailyRiddle() {
  const day = DAY();
  const seed = day.split("-").reduce((a, b) => a + Number(b), 0);
  return { ...RIDDLES[seed % RIDDLES.length], id: day };
}

export const SPIN_PRIZES = [
  { label: "+25 HP", hp: 25, weight: 30 },
  { label: "+40 HP", hp: 40, weight: 25 },
  { label: "+50 HP", hp: 50, weight: 20 },
  { label: "+75 HP", hp: 75, weight: 15 },
  { label: "+100 HP", hp: 100, weight: 8 },
  { label: "+150 HP", hp: 150, weight: 2 },
];

export function rollSpin(): (typeof SPIN_PRIZES)[number] {
  const total = SPIN_PRIZES.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of SPIN_PRIZES) {
    r -= p.weight;
    if (r <= 0) return p;
  }
  return SPIN_PRIZES[0];
}