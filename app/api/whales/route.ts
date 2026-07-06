import { NextResponse } from "next/server";
import { CONTRACT_ADDRESS } from "@/lib/constants";

/**
 * GET /api/whales — recent large $ANSEM movements for the Intel feed.
 *
 * Today: simulated batch. To go live, set HELIUS_API_KEY (or BIRDEYE_API_KEY)
 * in Vercel env vars and implement the marked block; the key stays
 * server-side. The client keeps the same response shape either way.
 */

export const dynamic = "force-dynamic";

const WHALE_NAMES = ["orca.sol", "moby_degen", "deepwater", "leviathan", "krakenfeed", "bigfin"];
const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function fakeAddr(): string {
  let s = "";
  for (let i = 0; i < 8; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `${s.slice(0, 4)}…${s.slice(4)}`;
}

export async function GET() {
  const apiKey = process.env.HELIUS_API_KEY;

  if (apiKey) {
    // TODO (real data): Helius Enhanced Transactions API —
    // GET https://api.helius.xyz/v0/addresses/{CONTRACT_ADDRESS}/transactions?api-key=...
    // Filter for large TOKEN_TRANSFER / SWAP events and map to the shape below.
  }

  const txs = Array.from({ length: 6 }, (_, i) => {
    const isAnsem = Math.random() < 0.18;
    const r = Math.random();
    return {
      id: `${Date.now()}-${i}`,
      wallet: isAnsem
        ? "Ansem 🐂"
        : Math.random() < 0.5
          ? WHALE_NAMES[Math.floor(Math.random() * WHALE_NAMES.length)]
          : fakeAddr(),
      isAnsem,
      action: isAnsem ? (r < 0.6 ? "BUY" : "TRANSFER") : r < 0.45 ? "BUY" : r < 0.75 ? "SELL" : "TRANSFER",
      amount: Math.floor(Math.random() * 4_800_000) + 150_000,
    };
  });

  return NextResponse.json({ source: "simulated", token: CONTRACT_ADDRESS, txs });
}
