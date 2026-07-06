"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Award, Check, Copy, LogOut, Menu, Wallet, X } from "lucide-react";
import { BullLogo } from "@/components/BullLogo";
import { Button } from "@/components/ui/button";
import { useHerd } from "@/components/HerdProvider";
import { useMarket } from "@/components/MarketProvider";
import { useWallet } from "@/components/WalletProvider";
import { CREATOR_HANDLE, CREATOR_NAME, CREATOR_TAGLINE, LINKS } from "@/lib/constants";
import { BADGES } from "@/lib/points";
import { triggerBullCharge } from "@/lib/confetti";
import { cn, shortAddress } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#forge", label: "Forge" },
  { href: "#charge", label: "Charge" },
  { href: "#quests", label: "Quests" },
  { href: "#herd", label: "Herd" },
  { href: "#hands", label: "Hands" },
  { href: "#lore", label: "Lore" },
  { href: "#intel", label: "Intel" },
];

/** Live $ANSEM ticker fed by DexScreener (see MarketProvider). */
function PriceTicker() {
  const { live, price, change24h } = useMarket();
  const up = change24h >= 0;
  return (
    <div
      className="hidden items-center gap-2 font-mono text-xs md:flex"
      title={live ? "Live price via DexScreener" : "Connecting to DexScreener…"}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", live ? "animate-pulseglow bg-gold" : "bg-ash/50")} />
      <span className="text-ash">$ANSEM</span>
      {live ? (
        <>
          <motion.span
            key={price}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            className={cn("tabular-nums", up ? "text-gold" : "text-crimson-bright")}
          >
            ${price < 0.001 ? price.toFixed(7) : price.toFixed(4)}
          </motion.span>
          <span className={cn("tabular-nums", up ? "text-gold" : "text-crimson-bright")}>
            {up ? "▲" : "▼"} {Math.abs(change24h).toFixed(2)}%
          </span>
        </>
      ) : (
        <span className="text-ash/60">loading…</span>
      )}
    </div>
  );
}

/** Wallet + Herd profile dropdown. */
function ProfileMenu() {
  const { address, connecting, connect, disconnect } = useWallet();
  const { data, weeklyPoints, rank } = useHerd();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!address) {
    return (
      <Button size="sm" onClick={connect} disabled={connecting}>
        <Wallet size={14} />
        <span className="hidden sm:inline">{connecting ? "Connecting…" : "Connect Wallet"}</span>
        <span className="sm:hidden">{connecting ? "…" : "Connect"}</span>
      </Button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 border border-gold/40 px-3 py-2 font-mono text-xs text-gold transition-all hover:bg-gold/10 [clip-path:polygon(8px_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%,0_8px)]"
      >
        <Wallet size={13} />
        <span className="hidden sm:inline">{shortAddress(address)}</span>
        <span className="border-l border-gold/30 pl-2 font-bold tabular-nums">
          {data.total.toLocaleString()} HP
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-full mt-2 w-72 border border-gold/25 bg-panel p-4 shadow-panel"
          >
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(address);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch { /* ignore */ }
              }}
              className="flex w-full items-center justify-between gap-2 font-mono text-[11px] text-ash hover:text-bone"
            >
              <span className="truncate">{shortAddress(address, 8)}</span>
              {copied ? <Check size={12} className="text-gold" /> : <Copy size={12} />}
            </button>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="border border-edge px-1 py-2.5">
                <p className="font-display text-base text-gold">{data.total.toLocaleString()}</p>
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-ash">Herd Pts</p>
              </div>
              <div className="border border-edge px-1 py-2.5">
                <p className="font-display text-base text-bone">{weeklyPoints.toLocaleString()}</p>
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-ash">This week</p>
              </div>
              <div className="border border-edge px-1 py-2.5">
                <p className="font-display text-base text-crimson-bright">#{rank}</p>
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-ash">Rank</p>
              </div>
            </div>

            <div className="mt-3">
              <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-ash">
                <Award size={11} /> Badges · {data.badges.length}/{BADGES.length}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {BADGES.map((b) => (
                  <span
                    key={b.id}
                    title={`${b.name} — ${b.desc}`}
                    className={cn(
                      "text-lg transition-opacity",
                      data.badges.includes(b.id) ? "opacity-100" : "opacity-20 grayscale"
                    )}
                  >
                    {b.emoji}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-edge pt-3">
              <a
                href="#herd"
                onClick={() => setOpen(false)}
                className="font-mono text-[10px] uppercase tracking-widest text-gold hover:text-gold-glow"
              >
                View leaderboard →
              </a>
              <button
                onClick={() => {
                  disconnect();
                  setOpen(false);
                }}
                className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-ash hover:text-crimson-bright"
              >
                <LogOut size={11} /> Disconnect
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const clicks = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Easter egg: 5 rapid clicks on the bull triggers the stampede. */
  function onLogoClick() {
    clicks.current += 1;
    if (clickTimer.current) clearTimeout(clickTimer.current);
    if (clicks.current >= 5) {
      clicks.current = 0;
      triggerBullCharge();
    } else {
      clickTimer.current = setTimeout(() => (clicks.current = 0), 1500);
    }
  }

  return (
    <header className="nav-glass fixed inset-x-0 top-0 z-50 border-b border-gold/20 edge-glow-top">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Logo + wordmark */}
        <a
          href="#top"
          className="flex shrink-0 items-center gap-2.5"
          onClick={(e) => {
            e.preventDefault();
            onLogoClick();
            document.getElementById("top")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <BullLogo glow className="h-10 w-10 transition-transform hover:scale-110" />
          <span className="hidden font-display text-sm uppercase tracking-widest text-bone sm:inline">
            ANSEM<span className="text-gold"> Space</span>
          </span>
        </a>

        <PriceTicker />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-2.5 py-2 font-display text-[11px] uppercase tracking-[0.18em] text-ash transition-colors hover:text-gold"
            >
              {l.label}
            </a>
          ))}
          {/* Creator credit */}
          <a
            href={LINKS.creatorX}
            target="_blank"
            rel="noopener noreferrer"
            title={`${CREATOR_NAME} — Chief Builder`}
            className="ml-2 hidden items-center gap-1.5 border-l border-edge py-1 pl-3 font-mono text-[10px] text-ash/80 transition-colors hover:text-gold xl:flex"
          >
            <span className="text-crimson">❤</span>
            <span className="text-gold/90">{CREATOR_TAGLINE}</span>
          </a>
          <a
            href="#builders"
            className="hidden font-mono text-[9px] uppercase tracking-widest text-ash/60 transition-colors hover:text-gold lg:inline"
          >
            {CREATOR_NAME}
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <ProfileMenu />
          {/* Mobile hamburger */}
          <button
            className="p-2 text-bone lg:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-gold/10 bg-void/95 lg:hidden"
          >
            <div className="flex flex-col px-6 py-4">
              {NAV_LINKS.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setMenuOpen(false)}
                  className="border-b border-edge/50 py-3 font-display text-sm uppercase tracking-[0.2em] text-bone last:border-0 hover:text-gold"
                >
                  {l.label}
                </motion.a>
              ))}
              <a
                href={LINKS.creatorX}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="pt-4 font-mono text-[11px] text-ash transition-colors hover:text-gold"
              >
                {CREATOR_TAGLINE} · 𝕏 {CREATOR_HANDLE}
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
