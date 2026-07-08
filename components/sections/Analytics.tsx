"use client";

/**
 * SECTION — HERD ANALYTICS
 * Solscan-style holder intel: total wallets, incoming activity, size tiers,
 * concentration, buy/sell pressure, and top holders. Data via /api/analytics.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BarChart3,
  ExternalLink,
  Fish,
  Layers,
  TrendingUp,
  Users,
  Waves,
} from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { CONTRACT_ADDRESS, LINKS } from "@/lib/constants";
import { cn, formatCompact, formatUsd } from "@/lib/utils";

const POLL_MS = 60_000;
const SOLSCAN_TOKEN = `https://solscan.io/token/${CONTRACT_ADDRESS}`;

interface AnalyticsDto {
  sources: {
    holders: "solscan" | "helius" | "simulated";
    market: "dexscreener" | "offline";
    activity: "helius" | "dexscreener" | "simulated";
  };
  solscan: { configured: boolean; available: boolean; upgradeRequired: boolean };
  holders: {
    total: number | null;
    top10Pct: number;
    tiers: { whale: number; dolphin: number; shrimp: number; dust: number };
    list: Array<{
      rank: number;
      address: string;
      label: string;
      amount: number;
      pct: number;
      valueUsd?: number;
    }>;
  };
  activity: { incoming1h: number; incoming12h: number; incoming24h: number };
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

function SourcePill({
  label,
  live,
}: {
  label: string;
  live: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest",
        live ? "border-gold/30 bg-gold/10 text-gold" : "border-edge text-ash/60"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", live ? "animate-pulseglow bg-gold" : "bg-ash/40")} />
      {label}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "gold",
}: {
  icon: typeof Users;
  label: string;
  value: string;
  sub?: string;
  accent?: "gold" | "crimson" | "bone";
}) {
  const colors = {
    gold: "text-gold",
    crimson: "text-crimson-bright",
    bone: "text-bone",
  };
  return (
    <div className="surface-card gradient-border p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={cn("rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5", colors[accent])}>
          <Icon size={18} />
        </div>
        {sub && <p className="font-mono text-[10px] text-mist">{sub}</p>}
      </div>
      <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-ash">{label}</p>
      <p className={cn("mt-1 font-display text-3xl font-bold tabular-nums tracking-tight", colors[accent])}>
        {value}
      </p>
    </div>
  );
}

function TierBar({
  tiers,
}: {
  tiers: AnalyticsDto["holders"]["tiers"];
}) {
  const total = tiers.whale + tiers.dolphin + tiers.shrimp + tiers.dust || 1;
  const segments = [
    { key: "whale", label: "Whale ≥1%", count: tiers.whale, color: "bg-gold", width: (tiers.whale / total) * 100 },
    { key: "dolphin", label: "Dolphin 0.1–1%", count: tiers.dolphin, color: "bg-bone/50", width: (tiers.dolphin / total) * 100 },
    { key: "shrimp", label: "Shrimp 0.01–0.1%", count: tiers.shrimp, color: "bg-ash/60", width: (tiers.shrimp / total) * 100 },
    { key: "dust", label: "Dust <0.01%", count: tiers.dust, color: "bg-edge", width: (tiers.dust / total) * 100 },
  ];

  return (
    <div className="surface-card p-5">
      <h3 className="flex items-center gap-2 font-display text-sm uppercase tracking-widest text-gold">
        <Layers size={16} /> Holder Size Tiers
      </h3>
      <p className="mt-1 font-mono text-[10px] text-ash">Distribution across tracked wallets by % of supply</p>

      <div className="mt-5 flex h-4 overflow-hidden rounded-full bg-void">
        {segments.map((s) =>
          s.width > 0 ? (
            <motion.div
              key={s.key}
              initial={{ width: 0 }}
              whileInView={{ width: `${s.width}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className={cn(s.color, "min-w-[2px]")}
              title={`${s.label}: ${s.count}`}
            />
          ) : null
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {segments.map((s) => (
          <div key={s.key} className="rounded-xl border border-white/[0.05] bg-surface/60 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full", s.color)} />
              <span className="font-mono text-[9px] uppercase tracking-wider text-mist">{s.label}</span>
            </div>
            <p className="mt-1 font-display text-xl font-semibold text-bone">{s.count}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PressureBars({ market }: { market: AnalyticsDto["market"] }) {
  const windows = [
    { label: "5 min", buys: market.buys.m5, sells: market.sells.m5 },
    { label: "1 hour", buys: market.buys.h1, sells: market.sells.h1 },
    { label: "24 hours", buys: market.buys.h24, sells: market.sells.h24 },
  ];

  return (
    <div className="surface-card p-5">
      <h3 className="flex items-center gap-2 font-display text-sm uppercase tracking-widest text-gold">
        <TrendingUp size={16} /> Buy / Sell Pressure
        <SourcePill label="DexScreener" live={market.price > 0} />
      </h3>
      <p className="mt-1 font-mono text-[10px] text-ash">Swap transaction counts — not unique wallets</p>

      <div className="mt-5 space-y-4">
        {windows.map((w) => {
          const total = w.buys + w.sells || 1;
          const buyPct = (w.buys / total) * 100;
          return (
            <div key={w.label}>
              <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] text-ash">
                <span>{w.label}</span>
                <span>
                  <span className="text-gold">{w.buys.toLocaleString()} buys</span>
                  {" · "}
                  <span className="text-crimson-bright">{w.sells.toLocaleString()} sells</span>
                </span>
              </div>
              <div className="flex h-2.5 overflow-hidden rounded-full bg-void">
                <div className="bg-gold transition-all duration-700" style={{ width: `${buyPct}%` }} />
                <div className="bg-crimson/80 transition-all duration-700" style={{ width: `${100 - buyPct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/[0.05] pt-4 sm:grid-cols-4">
        {[
          { v: formatUsd(market.price, market.price < 0.01 ? 7 : 4), l: "Price" },
          { v: `${market.change24h >= 0 ? "+" : ""}${market.change24h.toFixed(2)}%`, l: "24h" },
          { v: formatUsd(market.volume24h, 0), l: "Volume" },
          { v: formatUsd(market.liquidity, 0), l: "Liquidity" },
        ].map((s) => (
          <div key={s.l} className="text-center">
            <p className="font-mono text-sm text-bone">{s.v}</p>
            <p className="font-mono text-[9px] uppercase tracking-wider text-mist">{s.l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopHoldersTable({
  list,
  source,
}: {
  list: AnalyticsDto["holders"]["list"];
  source: AnalyticsDto["sources"]["holders"];
}) {
  return (
    <div className="surface-card overflow-hidden p-5">
      <h3 className="flex flex-wrap items-center gap-2 font-display text-sm uppercase tracking-widest text-gold">
        <Fish size={16} /> Top Holders
        <SourcePill
          label={
            source === "solscan" ? "Solscan" : source === "helius" ? "Helius" : "Demo"
          }
          live={source !== "simulated"}
        />
      </h3>
      <p className="mt-1 font-mono text-[10px] text-ash">
        Largest wallets by share of circulating supply
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] font-mono text-xs">
          <thead>
            <tr className="border-b border-edge/60 text-left text-[9px] uppercase tracking-widest text-mist">
              <th className="pb-2 pr-3">#</th>
              <th className="pb-2 pr-3">Wallet</th>
              <th className="pb-2 pr-3 text-right">Amount</th>
              <th className="pb-2 text-right">Share</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-ash">
                  Loading holder data…
                </td>
              </tr>
            ) : (
              list.slice(0, 12).map((h) => (
                <tr key={`${h.rank}-${h.address}`} className="border-b border-edge/30">
                  <td className="py-2.5 pr-3 text-mist">{h.rank}</td>
                  <td className="py-2.5 pr-3">
                    <a
                      href={`${SOLSCAN_TOKEN}?annotated=${h.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-bone transition-colors hover:text-gold"
                    >
                      {h.label}
                    </a>
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-ash">
                    {formatCompact(h.amount)}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-gold">{h.pct.toFixed(2)}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Analytics() {
  const [data, setData] = useState<AnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function load() {
      try {
        const res = await fetch("/api/analytics");
        const json: AnalyticsDto = await res.json();
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
      if (!cancelled) timer = setTimeout(load, POLL_MS);
    }

    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const holdersLive = data?.sources.holders !== "simulated";
  const activityLive = data?.sources.activity !== "simulated";
  const totalLabel =
    data?.holders.total != null ? data.holders.total.toLocaleString() : loading ? "…" : "—";

  return (
    <section id="analytics" className="section-shell section-glow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          kicker="On-chain intel"
          title="Herd Analytics"
          sub="Holder count, wallet inflows, size tiers, and buy/sell pressure — Solscan-grade stats for $ANSEM bulls."
        />

        {/* Hero stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Total Holders"
            value={totalLabel}
            sub={holdersLive ? "Live" : "Connecting"}
          />
          <StatCard
            icon={ArrowUpRight}
            label="Incoming Wallets · 1h"
            value={data ? data.activity.incoming1h.toLocaleString() : "…"}
            sub={activityLive ? "Unique recipients" : undefined}
            accent="bone"
          />
          <StatCard
            icon={Waves}
            label="Incoming Wallets · 12h"
            value={data ? data.activity.incoming12h.toLocaleString() : "…"}
            accent="bone"
          />
          <StatCard
            icon={BarChart3}
            label="Top 10 Concentration"
            value={data ? `${data.holders.top10Pct}%` : "…"}
            sub="Of total supply"
          />
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          {data ? <TierBar tiers={data.holders.tiers} /> : <div className="surface-card h-48 animate-pulse" />}
          {data ? <PressureBars market={data.market} /> : <div className="surface-card h-48 animate-pulse" />}
        </div>

        {data && <TopHoldersTable list={data.holders.list} source={data.sources.holders} />}

        {/* Solscan attribution + CTA */}
        <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/[0.06] bg-surface/50 px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-mist">Data sources</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <SourcePill
                label={data?.solscan.available ? "Solscan Pro" : "Solscan (pending)"}
                live={Boolean(data?.solscan.available)}
              />
              <SourcePill label="Helius" live={data?.sources.holders === "helius" || data?.sources.activity === "helius"} />
              <SourcePill label="DexScreener" live={data?.sources.market === "dexscreener"} />
            </div>
            {data?.solscan.upgradeRequired && (
              <p className="mt-2 max-w-xl font-mono text-[10px] leading-relaxed text-ash">
                Solscan key detected but holder endpoints need activation or a paid tier. Showing Helius +
                DexScreener until Solscan unlocks.
              </p>
            )}
            <p className="mt-2 font-mono text-[10px] text-mist">
              Holder analytics powered by{" "}
              <a
                href="https://solscan.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline"
              >
                Solscan
              </a>
              {" · "}
              Attribution required per Solscan Free API terms
            </p>
          </div>
          <a
            href={SOLSCAN_TOKEN}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2.5 font-mono text-xs text-gold transition-all hover:bg-gold/20"
          >
            Full token page on Solscan
            <ExternalLink size={14} />
          </a>
        </div>

        <p className="mt-4 text-center font-mono text-[10px] text-mist">
          Incoming wallets = unique addresses that received $ANSEM in the window (Helius). Not the same as net-new
          holders. Refreshes every {POLL_MS / 1000}s.
          {" · "}
          <a href={LINKS.pumpFun} className="text-gold/80 hover:text-gold">
            Trade on pump.fun
          </a>
        </p>
      </div>
    </section>
  );
}