import { NextResponse } from "next/server";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { seededRandom } from "@/lib/utils";

/**
 * GET /api/holders — $ANSEM holder distribution for the Intel bubblemap.
 *
 * Today: returns realistic simulated data (deterministic, so the map is
 * stable between requests).
 *
 * To go live: set HELIUS_API_KEY in Vercel env vars and implement the
 * fetch below. The key stays server-side — never expose it to the client.
 */

export const dynamic = "force-dynamic";

interface Holder {
  label: string;
  pct: number;
  isAnsem: boolean;
}

export async function GET() {
  const apiKey = process.env.HELIUS_API_KEY;

  if (apiKey) {
    // TODO (real data): Helius DAS — getTokenLargestAccounts / getTokenAccounts
    // const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     jsonrpc: "2.0",
    //     id: "holders",
    //     method: "getTokenLargestAccounts",
    //     params: [CONTRACT_ADDRESS],
    //   }),
    //   next: { revalidate: 300 },
    // });
    // ...map response into Holder[] and return it.
  }

  // Simulated fallback — same shape the real integration will return.
  const rand = seededRandom(4269);
  const names = ["LP Pool", "orca.sol", "herd_og", "moby", "grandma_sol", "bullmonk", "deepwater", "hoofdaddy"];
  const holders: Holder[] = [{ label: "Ansem 🐂", pct: 6.9, isAnsem: true }];
  for (let i = 0; i < 22; i++) {
    holders.push({
      label: i < names.length ? names[i] : `wallet_${Math.floor(rand() * 9000 + 1000)}`,
      pct: Number((0.2 + rand() * 3.4).toFixed(2)),
      isAnsem: false,
    });
  }

  return NextResponse.json({
    source: "simulated",
    token: CONTRACT_ADDRESS,
    holders,
  });
}
