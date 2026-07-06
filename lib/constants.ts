/** Single source of truth for $ANSEM community constants. */

export const CONTRACT_ADDRESS = "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump";

export const TICKER = "$ANSEM";
export const SITE_NAME = "ANSEM Space";
export const SITE_URL = "https://ansem.space";
export const TAGLINE = "Forge Memes. Charge Forward. Hold the Line.";

export const LINKS = {
  pumpFun: `https://pump.fun/coin/${CONTRACT_ADDRESS}`,
  jupiter: `https://jup.ag/swap/SOL-${CONTRACT_ADDRESS}`,
  ansemX: "https://x.com/blknoiz06",
  creatorX: "https://x.com/DannyMD_UK",
};

/** Site creator — connects to unlock the admin asset manager at /admin. */
export const CREATOR_WALLET = "3bdYdaDkjvKDST9zzjAZRpsodpd7DpU618QgMdpwtfWM";
export const CREATOR_NAME = "Dr Danny";
export const CREATOR_HANDLE = "@DannyMD_UK";
export const CREATOR_TAGLINE = "Made with ❤️ by Dr Danny for the Herd";
export const CREATOR_STORY =
  "Physician, builder, and bull of the herd. Dr Danny forged ANSEM Space from scratch — meme lab, arcade, global leaderboard, live intel — so every holder has a home worth charging into.";

export const HASHTAGS = "#ANSEM #Solana #TheBlackBull";

/** Open an X (Twitter) compose window pre-filled with $ANSEM share text. */
export function shareOnX(text: string) {
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `${text}\n\n${HASHTAGS}\n${SITE_URL}\n\n— ${CREATOR_TAGLINE} · ${CREATOR_HANDLE}`
  )}`;
  window.open(url, "_blank", "noopener,noreferrer,width=600,height=650");
}

/** localStorage keys — namespaced so we never collide. */
export const LS = {
  wallet: "ansem_wallet",
  memes: "ansem_memes",
  memeVotes: "ansem_meme_votes",
  highScore: "ansem_highscore",
  playerScores: "ansem_player_scores",
  daily: "ansem_daily",
  prediction: "ansem_prediction",
  storyName: "ansem_story_name",
  referrals: "ansem_referrals",
  referralClaimed: "ansem_referral_claimed",
} as const;
