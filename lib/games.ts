/** Shared arcade helpers — per-game high scores + unified leaderboard. */

import { LS } from "@/lib/constants";
import { store } from "@/lib/utils";

export type ArcadeGame = "charge" | "tap" | "hold" | "pump" | "rug" | "match";

export interface ArcadeScore {
  name: string;
  score: number;
  game: ArcadeGame;
}

export interface GameHighs {
  charge: number;
  tap: number;
  hold: number;
  pump: number;
  rug: number;
  match: number;
}

const DEFAULT_HIGHS: GameHighs = { charge: 0, tap: 0, hold: 0, pump: 0, rug: 0, match: 0 };

export function loadHighs(): GameHighs {
  return { ...DEFAULT_HIGHS, ...store.get<Partial<GameHighs>>(LS.gameHighs, {}) };
}

export function saveHigh(game: ArcadeGame, score: number): boolean {
  const highs = loadHighs();
  if (score <= highs[game]) return false;
  highs[game] = score;
  store.set(LS.gameHighs, highs);
  // Legacy Charge high score key
  if (game === "charge") store.set(LS.highScore, score);
  return true;
}

export function loadLeaderboard(): ArcadeScore[] {
  return store.get<ArcadeScore[]>(LS.playerScores, []);
}

export function submitScore(entry: ArcadeScore): ArcadeScore[] {
  const next = [...loadLeaderboard(), entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
  store.set(LS.playerScores, next);
  return next;
}

export const GAME_LABELS: Record<ArcadeGame, string> = {
  charge: "Charge",
  tap: "Bull Tap",
  hold: "Hold the Line",
  pump: "Pump or Dump",
  rug: "Rug Dodge",
  match: "Bull Match",
};

export const GAME_CATEGORIES = {
  action: ["charge", "tap", "rug"] as ArcadeGame[],
  skill: ["hold", "pump", "match"] as ArcadeGame[],
};