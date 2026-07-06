import { NextResponse } from "next/server";
import { CONTRACT_ADDRESS } from "@/lib/constants";

/**
 * GET /api/whales — recent large $ANSEM movements for the Intel feed.
 *
 * With HELIUS_API_KEY set: real recent transactions via the Helius Enhanced
 * Transactions API (BUY/SELL inferred from swap direction). Without it — or
 * on any Helius error — falls back to a simulated batch, same shape.
 */

export const dynamic = "force-dynamic";

interface WhaleTxDto {
  id: string;
  wallet: string;
  isAnsem: boolean;
  action: "BUY" | "SELL" | "TRANSFER";
  amount: number;
  time?: number; // unix seconds (real data only)
}

interface WhalesBody {
  source: "helius" | "simulated";
  token: string;
  txs: WhaleTxDto[];
}

let cache: { at: number; body: WhalesBody } | null = null;
const TTL_MS = 20_000;

const WHALE_NAMES = ["orca.sol", "moby_degen", "deepwater", "leviathan", "krakenfeed", "bigfin"];
const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

const short = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`;

async function fetchRealTxs(apiKey: string): Promise<WhaleTxDto[]> {
  const url = `https://api.helius.xyz/v0/addresses/${CONTRACT_ADDRESS}/transactions?api-key=${apiKey}&limit=30`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Helius HTTP ${res.status}`);
  const raw = await res.json();
  if (!Array.isArray(raw)) throw new Error("unexpected Helius response");

  const build = (minAmount: number): WhaleTxDto[] => {
  const txs: WhaleTxDto[] = [];
  for (const tx of raw) {
    const transfers = (tx.tokenTransfers ?? []).filter(
      (t: { mint?: string; tokenAmount?: number }) =>
        t.mint === CONTRACT_ADDRESS && (t.tokenAmount ?? 0) >= minAmount
    );
    if (transfers.length === 0) continue;
    const t = transfers.sort(
      (a: { tokenAmount: number }, b: { tokenAmount: number }) => b.tokenAmount - a.tokenAmount
    )[0];

    const action: WhaleTxDto["action"] =
      tx.type === "SWAP"
        ? t.toUserAccount === tx.feePayer
          ? "BUY"
          : t.fromUserAccount === tx.feePayer
            ? "SELL"
            : "TRANSFER"
        : "TRANSFER";

    const wallet: string =
      (action === "SELL" ? t.fromUserAccount : t.toUserAccount) || tx.feePayer || "unknown";

    txs.push({
      id: String(tx.signature ?? txs.length),
      wallet: short(wallet),
      isAnsem: false,
      action,
      amount: Math.round(t.tokenAmount),
      time: tx.timestamp,
    });
    if (txs.length >= 10) break;
  }
  return txs;
  };

  // Prefer meaningful moves; if the recent window is all dust, show it anyway
  // rather than falling back to fake data.
  const txs = build(1000);
  const result = txs.length > 0 ? txs : build(0.000001);
  if (result.length === 0) throw new Error("no token transfers found");
  return result;
}

function simulatedTxs(): WhaleTxDto[] {
  const fakeAddr = () => {
    let s = "";
    for (let i = 0; i < 8; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    return `${s.slice(0, 4)}…${s.slice(4)}`;
  };
  return Array.from({ length: 6 }, (_, i) => {
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
      action: (isAnsem
        ? r < 0.6
          ? "BUY"
          : "TRANSFER"
        : r < 0.45
          ? "BUY"
          : r < 0.75
            ? "SELL"
            : "TRANSFER") as WhaleTxDto["action"],
      amount: Math.floor(Math.random() * 4_800_000) + 150_000,
    };
  });
}

export async function GET() {
  if (cache && Date.now() - cache.at < TTL_MS) {
    return NextResponse.json(cache.body);
  }

  const apiKey = process.env.HELIUS_API_KEY;
  let body: WhalesBody;

  if (apiKey) {
    try {
      body = { source: "helius", token: CONTRACT_ADDRESS, txs: await fetchRealTxs(apiKey) };
    } catch {
      body = { source: "simulated", token: CONTRACT_ADDRESS, txs: simulatedTxs() };
    }
  } else {
    body = { source: "simulated", token: CONTRACT_ADDRESS, txs: simulatedTxs() };
  }

  if (body.source === "helius") cache = { at: Date.now(), body };
  return NextResponse.json(body);
}
