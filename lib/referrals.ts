/**
 * Referral program — invite friends via ?ref=CODE, earn tiered HP bonuses.
 */

import { store } from "@/lib/utils";
import { LS } from "@/lib/constants";
import { loadPlayer, savePlayerDirect, weekKey } from "@/lib/points";

const REFERRAL_TIERS = [
  { count: 1, reward: 100, label: "First recruit" },
  { count: 3, reward: 250, label: "Squad leader" },
  { count: 5, reward: 500, label: "Herd captain" },
  { count: 10, reward: 1000, label: "Bull general" },
] as const;

export interface ReferralData {
  code: string;
  referredBy: string | null;
  recruits: string[];
  tiersClaimed: number[];
}

function refKey(address: string) {
  return `${LS.referrals}_${address}`;
}

/** Deterministic 6-char referral code from wallet. */
export function referralCode(address: string): string {
  const cached = store.get<string | null>(refKey(address), null);
  if (cached) return cached;
  const code = address.slice(2, 8).toUpperCase();
  store.set(refKey(address), code);
  return code;
}

export function referralLink(address: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "https://www.ansem.space";
  return `${base}?ref=${referralCode(address)}`;
}

export function loadReferralData(address: string | null): ReferralData | null {
  if (!address) return null;
  return store.get<ReferralData | null>(`${LS.referrals}_data_${address}`, {
    code: referralCode(address),
    referredBy: null,
    recruits: [],
    tiersClaimed: [],
  });
}

export function saveReferralData(address: string, data: ReferralData) {
  store.set(`${LS.referrals}_data_${address}`, data);
}

/** Parse ?ref= from URL on first visit. */
export function captureReferralFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("ref")?.toUpperCase() ?? null;
}

/** Find wallet that owns a referral code (scans local storage — server route handles global). */
export function findLocalReferrer(code: string): string | null {
  if (typeof window === "undefined") return null;
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key?.startsWith(LS.referrals + "_") || key.includes("_data_")) continue;
    const stored = store.get<string | null>(key, null);
    if (stored === code) return key.replace(`${LS.referrals}_`, "");
  }
  return null;
}

export interface ReferralClaimResult {
  gained: number;
  label: string;
  tier: number;
}

/** Award tier bonus when recruit count crosses a threshold. */
export function claimReferralTier(address: string, tierCount: number): ReferralClaimResult | null {
  const data = loadReferralData(address);
  if (!data || data.recruits.length < tierCount) return null;
  if (data.tiersClaimed.includes(tierCount)) return null;

  const tier = REFERRAL_TIERS.find((t) => t.count === tierCount);
  if (!tier) return null;

  data.tiersClaimed.push(tierCount);
  saveReferralData(address, data);

  const player = loadPlayer(address);
  player.total += tier.reward;
  const wk = weekKey();
  player.weekly[wk] = (player.weekly[wk] ?? 0) + tier.reward;
  player.counters.referrals = data.recruits.length;
  savePlayerDirect(address, player);

  return { gained: tier.reward, label: tier.label, tier: tierCount };
}

/** Process a new recruit (referee gets 50 HP, referrer gets 75 HP). */
export function processReferralSignup(referee: string, referrerCode: string): { refereeHp: number; referrerHp: number } | null {
  const claimed = store.get<string | null>(LS.referralClaimed, null);
  if (claimed) return null;

  const refData = loadReferralData(referee);
  if (refData?.referredBy) return null;
  if (referralCode(referee) === referrerCode) return null;

  // Award referee
  const player = loadPlayer(referee);
  player.total += 50;
  const wk = weekKey();
  player.weekly[wk] = (player.weekly[wk] ?? 0) + 50;
  savePlayerDirect(referee, player);

  const rData = loadReferralData(referee) ?? {
    code: referralCode(referee),
    referredBy: referrerCode,
    recruits: [],
    tiersClaimed: [],
  };
  rData.referredBy = referrerCode;
  saveReferralData(referee, rData);
  store.set(LS.referralClaimed, referee);

  return { refereeHp: 50, referrerHp: 75 };
}

export { REFERRAL_TIERS };