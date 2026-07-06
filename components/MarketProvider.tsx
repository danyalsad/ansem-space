"use client";

/**
 * Live $ANSEM market data from the DexScreener public API (no key needed).
 * Polls every 30s; falls back to `live: false` with sane placeholder values
 * if the API is unreachable so the UI never breaks.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { CONTRACT_ADDRESS } from "@/lib/constants";

const API_URL = `https://api.dexscreener.com/latest/dex/tokens/${CONTRACT_ADDRESS}`;
const POLL_MS = 30_000;

interface DexPair {
  priceUsd?: string;
  priceChange?: { h24?: number };
  volume?: { h24?: number };
  txns?: { h24?: { buys?: number; sells?: number } };
  marketCap?: number;
  fdv?: number;
  liquidity?: { usd?: number };
}

export interface MarketData {
  live: boolean;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  buys24h: number;
  sells24h: number;
  updatedAt: number;
}

const FALLBACK: MarketData = {
  live: false,
  price: 0,
  change24h: 0,
  volume24h: 0,
  marketCap: 0,
  liquidity: 0,
  buys24h: 0,
  sells24h: 0,
  updatedAt: 0,
};

const MarketContext = createContext<MarketData>(FALLBACK);

export function MarketProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<MarketData>(FALLBACK);

  useEffect(() => {
    let cancelled = false;

    async function fetchMarket() {
      try {
        const res = await fetch(API_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: { pairs?: DexPair[] } = await res.json();
        // Deepest-liquidity pair is the canonical market.
        const pair = (json.pairs ?? [])
          .slice()
          .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
        if (!pair || cancelled) return;
        setData({
          live: true,
          price: Number(pair.priceUsd ?? 0),
          change24h: pair.priceChange?.h24 ?? 0,
          volume24h: pair.volume?.h24 ?? 0,
          marketCap: pair.marketCap ?? pair.fdv ?? 0,
          liquidity: pair.liquidity?.usd ?? 0,
          buys24h: pair.txns?.h24?.buys ?? 0,
          sells24h: pair.txns?.h24?.sells ?? 0,
          updatedAt: Date.now(),
        });
      } catch {
        // Keep last good data; mark stale only if we never got any.
        if (!cancelled) setData((d) => (d.updatedAt ? d : { ...FALLBACK }));
      }
    }

    fetchMarket();
    const id = setInterval(fetchMarket, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return <MarketContext.Provider value={data}>{children}</MarketContext.Provider>;
}

export function useMarket() {
  return useContext(MarketContext);
}
