import { NextResponse } from "next/server";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { seededRandom } from "@/lib/utils";

/**
 * GET /api/holders — $ANSEM holder distribution for the Intel bubblemap.
 *
 * With HELIUS_API_KEY set (Vercel env var, server-side only): returns the
 * real top-20 token holders via Helius RPC. Without it — or if Helius
 * errors — falls back to simulated data with the same shape.
 */

export const dynamic = "force-dynamic";

interface Holder {
  label: string;
  pct: number;
  isAnsem: boolean;
}

interface HoldersBody {
  source: "helius" | "simulated";
  token: string;
  holders: Holder[];
}

// Per-instance memo so bursts of visitors don't hammer Helius.
let cache: { at: number; body: HoldersBody } | null = null;
const TTL_MS = 120_000;

const short = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`;

async function fetchRealHolders(apiKey: string): Promise<Holder[]> {
  const rpc = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
  const call = async (method: string, params: unknown[]) => {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: method, method, params }),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Helius ${method}: HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(`Helius ${method}: ${json.error.message}`);
    return json.result;
  };

  const [largest, supply] = await Promise.all([
    call("getTokenLargestAccounts", [CONTRACT_ADDRESS]),
    call("getTokenSupply", [CONTRACT_ADDRESS]),
  ]);

  const accounts: Array<{ address: string; uiAmount: number }> = largest.value;
  const totalSupply: number = supply.value.uiAmount;
  if (!accounts?.length || !totalSupply) throw new Error("empty holder data");

  // Token accounts → owner wallets, so the map shows people not ATAs.
  const owners = await call("getMultipleAccounts", [
    accounts.map((a) => a.address),
    { encoding: "jsonParsed" },
  ]);

  return accounts
    .map((a, i) => {
      const owner: string =
        owners?.value?.[i]?.data?.parsed?.info?.owner ?? a.address;
      return {
        label: short(owner),
        pct: Number(((a.uiAmount / totalSupply) * 100).toFixed(2)),
        isAnsem: false,
      };
    })
    .filter((h) => h.pct > 0);
}

function simulatedHolders(): Holder[] {
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
  return holders;
}

export async function GET() {
  if (cache && Date.now() - cache.at < TTL_MS) {
    return NextResponse.json(cache.body);
  }

  const apiKey = process.env.HELIUS_API_KEY;
  let body: HoldersBody;

  if (apiKey) {
    try {
      body = { source: "helius", token: CONTRACT_ADDRESS, holders: await fetchRealHolders(apiKey) };
    } catch {
      body = { source: "simulated", token: CONTRACT_ADDRESS, holders: simulatedHolders() };
    }
  } else {
    body = { source: "simulated", token: CONTRACT_ADDRESS, holders: simulatedHolders() };
  }

  if (body.source === "helius") cache = { at: Date.now(), body };
  return NextResponse.json(body);
}
