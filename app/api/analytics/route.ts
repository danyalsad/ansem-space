import { NextResponse } from "next/server";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { fetchTokenHolders, type SolscanHolder } from "@/lib/solscan";
import { seededRandom } from "@/lib/utils";

/**
 * GET /api/analytics — $ANSEM herd analytics for the Analytics section.
 *
 * Data stack (best available wins):
 *  - Solscan Pro API (SOLSCAN_API_KEY): holder count + ranked list when key tier allows
 *  - Helius (HELIUS_API_KEY): top holders, tier distribution, incoming-wallet activity
 *  - DexScreener (no key): price, volume, buy/sell pressure windows
 */

export const dynamic = "force-dynamic";

const TTL_MS = 120_000;
const TOKEN_2022 = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const DEX_URL = `https://api.dexscreener.com/latest/dex/tokens/${CONTRACT_ADDRESS}`;

interface HolderRow {
  rank: number;
  address: string;
  label: string;
  amount: number;
  pct: number;
  valueUsd?: number;
}

interface TierCounts {
  whale: number;
  dolphin: number;
  shrimp: number;
  dust: number;
}

interface AnalyticsBody {
  token: string;
  sources: {
    holders: "solscan" | "helius" | "simulated";
    market: "dexscreener" | "offline";
    activity: "helius" | "dexscreener" | "simulated";
  };
  solscan: { configured: boolean; available: boolean; upgradeRequired: boolean };
  holders: {
    total: number | null;
    top10Pct: number;
    tiers: TierCounts;
    list: HolderRow[];
  };
  activity: {
    incoming1h: number;
    incoming12h: number;
    incoming24h: number;
  };
  market: {
    price: number;
    change24h: number;
    volume24h: number;
    marketCap: number;
    liquidity: number;
    buys: { m5: number; h1: number; h24: number };
    sells: { m5: number; h1: number; h24: number };
  };
  updatedAt: number;
}

let cache: { at: number; body: AnalyticsBody } | null = null;

const short = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`;

function classifyTiers(holders: Array<{ pct: number }>): TierCounts {
  const tiers: TierCounts = { whale: 0, dolphin: 0, shrimp: 0, dust: 0 };
  for (const h of holders) {
    if (h.pct >= 1) tiers.whale++;
    else if (h.pct >= 0.1) tiers.dolphin++;
    else if (h.pct >= 0.01) tiers.shrimp++;
    else tiers.dust++;
  }
  return tiers;
}

function top10Pct(holders: Array<{ pct: number }>): number {
  return Number(
    holders
      .slice(0, 10)
      .reduce((s, h) => s + h.pct, 0)
      .toFixed(2)
  );
}

async function heliusRpc<T>(apiKey: string, method: string, params: unknown[]): Promise<T> {
  const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: method, method, params }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Helius ${method}: HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(`Helius ${method}: ${json.error.message}`);
  return json.result as T;
}

async function fetchHeliusHolders(apiKey: string): Promise<{
  total: number | null;
  list: HolderRow[];
}> {
  const [largest, supply, programAccounts] = await Promise.all([
    heliusRpc<{ value: Array<{ address: string; uiAmount: number }> }>(
      apiKey,
      "getTokenLargestAccounts",
      [CONTRACT_ADDRESS]
    ),
    heliusRpc<{ value: { uiAmount: number } }>(apiKey, "getTokenSupply", [CONTRACT_ADDRESS]),
    heliusRpc<
      Array<{
        account: { data: { parsed: { info: { tokenAmount: { uiAmount: number | null } } } } };
      }>
    >(apiKey, "getProgramAccounts", [
      TOKEN_2022,
      {
        encoding: "jsonParsed",
        filters: [{ dataSize: 165 }, { memcmp: { offset: 0, bytes: CONTRACT_ADDRESS } }],
      },
    ]).catch(() => [] as Array<never>),
  ]);

  const totalSupply = supply.value.uiAmount;
  const accounts = largest.value ?? [];
  if (!accounts.length || !totalSupply) throw new Error("empty holder data");

  const owners = await heliusRpc<{ value: Array<{ data?: { parsed?: { info?: { owner?: string } } } }> }>(
    apiKey,
    "getMultipleAccounts",
    [accounts.map((a) => a.address), { encoding: "jsonParsed" }]
  );

  const list: HolderRow[] = accounts.map((a, i) => {
    const owner = owners?.value?.[i]?.data?.parsed?.info?.owner ?? a.address;
    const pct = Number(((a.uiAmount / totalSupply) * 100).toFixed(4));
    return {
      rank: i + 1,
      address: owner,
      label: short(owner),
      amount: a.uiAmount,
      pct,
    };
  });

  const nonzero =
    programAccounts.length > 0
      ? programAccounts.filter((a) => (a.account.data.parsed.info.tokenAmount.uiAmount ?? 0) > 0).length
      : null;

  return { total: nonzero, list };
}

async function fetchIncomingWallets(apiKey: string): Promise<{
  incoming1h: number;
  incoming12h: number;
  incoming24h: number;
}> {
  const url = `https://api.helius.xyz/v0/addresses/${CONTRACT_ADDRESS}/transactions?api-key=${apiKey}&limit=80`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Helius txs HTTP ${res.status}`);
  const raw = await res.json();
  if (!Array.isArray(raw)) throw new Error("unexpected Helius txs");

  const now = Math.floor(Date.now() / 1000);
  const windows = { h1: new Set<string>(), h12: new Set<string>(), h24: new Set<string>() };

  for (const tx of raw) {
    const ts: number = tx.timestamp ?? 0;
    const age = now - ts;
    if (age > 86_400) continue;

    for (const t of tx.tokenTransfers ?? []) {
      if (t.mint !== CONTRACT_ADDRESS || !t.toUserAccount) continue;
      const wallet = t.toUserAccount as string;
      if (age <= 3_600) windows.h1.add(wallet);
      if (age <= 43_200) windows.h12.add(wallet);
      windows.h24.add(wallet);
    }
  }

  return {
    incoming1h: windows.h1.size,
    incoming12h: windows.h12.size,
    incoming24h: windows.h24.size,
  };
}

async function fetchDexMarket(): Promise<AnalyticsBody["market"]> {
  const res = await fetch(DEX_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`DexScreener HTTP ${res.status}`);
  const json: {
    pairs?: Array<{
      priceUsd?: string;
      priceChange?: { h24?: number };
      volume?: { h24?: number };
      txns?: { m5?: { buys?: number; sells?: number }; h1?: { buys?: number; sells?: number }; h24?: { buys?: number; sells?: number } };
      marketCap?: number;
      fdv?: number;
      liquidity?: { usd?: number };
    }>;
  } = await res.json();

  const pair = (json.pairs ?? []).sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
  if (!pair) throw new Error("no DexScreener pair");

  return {
    price: Number(pair.priceUsd ?? 0),
    change24h: pair.priceChange?.h24 ?? 0,
    volume24h: pair.volume?.h24 ?? 0,
    marketCap: pair.marketCap ?? pair.fdv ?? 0,
    liquidity: pair.liquidity?.usd ?? 0,
    buys: {
      m5: pair.txns?.m5?.buys ?? 0,
      h1: pair.txns?.h1?.buys ?? 0,
      h24: pair.txns?.h24?.buys ?? 0,
    },
    sells: {
      m5: pair.txns?.m5?.sells ?? 0,
      h1: pair.txns?.h1?.sells ?? 0,
      h24: pair.txns?.h24?.sells ?? 0,
    },
  };
}

function solscanToRows(items: SolscanHolder[]): HolderRow[] {
  return items.map((h) => ({
    rank: h.rank,
    address: h.owner || h.address,
    label: short(h.owner || h.address),
    amount: h.amount,
    pct: Number((h.percentage ?? 0).toFixed(4)),
    valueUsd: h.value,
  }));
}

function simulatedAnalytics(): AnalyticsBody {
  const rand = seededRandom(90210);
  const list: HolderRow[] = Array.from({ length: 15 }, (_, i) => ({
    rank: i + 1,
    address: `sim${i}`,
    label: i === 0 ? "LP Pool" : `wallet_${1000 + i}`,
    amount: Math.floor(rand() * 50_000_000) + 100_000,
    pct: Number((0.05 + rand() * 4).toFixed(2)),
  }));

  return {
    token: CONTRACT_ADDRESS,
    sources: { holders: "simulated", market: "offline", activity: "simulated" },
    solscan: { configured: false, available: false, upgradeRequired: false },
    holders: {
      total: 12_400,
      top10Pct: top10Pct(list),
      tiers: classifyTiers(list),
      list,
    },
    activity: { incoming1h: 42, incoming12h: 318, incoming24h: 891 },
    market: {
      price: 0,
      change24h: 0,
      volume24h: 0,
      marketCap: 0,
      liquidity: 0,
      buys: { m5: 0, h1: 0, h24: 0 },
      sells: { m5: 0, h1: 0, h24: 0 },
    },
    updatedAt: Date.now(),
  };
}

export async function GET() {
  if (cache && Date.now() - cache.at < TTL_MS) {
    return NextResponse.json(cache.body);
  }

  const heliusKey = process.env.HELIUS_API_KEY;
  const solscanKey = process.env.SOLSCAN_API_KEY;

  let body: AnalyticsBody = simulatedAnalytics();
  let live = false;

  // Market data — always try DexScreener first.
  try {
    body.market = await fetchDexMarket();
    body.sources.market = "dexscreener";
    live = true;
  } catch {
    body.sources.market = "offline";
  }

  // Holders — Solscan first, then Helius.
  body.solscan = {
    configured: Boolean(solscanKey),
    available: false,
    upgradeRequired: false,
  };

  if (solscanKey) {
    const solscan = await fetchTokenHolders(solscanKey, CONTRACT_ADDRESS, 40);
    if (solscan.ok) {
      const list = solscanToRows(solscan.data.items);
      body.holders = {
        total: solscan.data.total,
        top10Pct: top10Pct(list),
        tiers: classifyTiers(list),
        list,
      };
      body.sources.holders = "solscan";
      body.solscan.available = true;
      live = true;
    } else {
      body.solscan.upgradeRequired = solscan.upgradeRequired;
    }
  }

  if (body.sources.holders !== "solscan" && heliusKey) {
    try {
      const { total, list } = await fetchHeliusHolders(heliusKey);
      body.holders = {
        total,
        top10Pct: top10Pct(list),
        tiers: classifyTiers(list),
        list,
      };
      body.sources.holders = "helius";
      live = true;
    } catch {
      /* keep simulated holders */
    }
  }

  // Incoming wallet activity — Helius enhanced txs.
  if (heliusKey) {
    try {
      body.activity = await fetchIncomingWallets(heliusKey);
      body.sources.activity = "helius";
      live = true;
    } catch {
      /* keep simulated or zero activity */
    }
  } else if (body.sources.market === "dexscreener") {
    // Dex buys as a rough proxy when Helius activity is unavailable.
    body.activity = {
      incoming1h: body.market.buys.h1,
      incoming12h: Math.round((body.market.buys.h1 + body.market.buys.h24) / 2),
      incoming24h: body.market.buys.h24,
    };
    body.sources.activity = "dexscreener";
  }

  body.updatedAt = Date.now();

  if (live) cache = { at: Date.now(), body };
  return NextResponse.json(body);
}