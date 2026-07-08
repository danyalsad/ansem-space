"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Award, Check, Copy, LogOut, Menu, Wallet, X } from "lucide-react";
import { BullLogo } from "@/components/BullLogo";
import { Button } from "@/components/ui/button";
import { useHerd } from "@/components/HerdProvider";
import { useMarket } from "@/components/MarketProvider";
import { useWallet } from "@/components/WalletProvider";
import { CREATOR_HANDLE, LINKS } from "@/lib/constants";
import { BADGES } from "@/lib/points";
import { triggerBullCharge } from "@/lib/confetti";
import { cn, shortAddress } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#forge", label: "Forge" },
  { href: "#charge", label: "Arcade" },
  { href: "#quests", label: "Quests" },
  { href: "#herd", label: "Herd" },
  { href: "#hands", label: "Hands" },
  { href: "#lore", label: "Lore" },
  { href: "#analytics", label: "Analytics" },
  { href: "#intel", label: "Intel" },
];

function PriceTicker() {
  const { live, price, change24h } = useMarket();
  const up = change24h >= 0;
  return (
    <div
      className="hidden items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 font-mono text-xs md:flex"
      title={live ? "Live via DexScreener" : "Connecting…"}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", live ? "animate-pulseglow bg-gold" : "bg-mist")} />
      <span className="text-mist">$ANSEM</span>
      {live ? (
        <>
          <span className={cn("tabular-nums font-medium", up ? "text-gold" : "text-crimson-bright")}>
            ${price < 0.001 ? price.toFixed(7) : price.toFixed(4)}
          </span>
          <span className={cn("tabular-nums text-mist", up ? "text-gold/80" : "text-crimson-bright/80")}>
            {up ? "+" : ""}{change24h.toFixed(2)}%
          </span>
        </>
      ) : (
        <span className="text-mist">…</span>
      )}
    </div>
  );
}

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
        <span className="hidden sm:inline">{connecting ? "Connecting…" : "Connect"}</span>
      </Button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-gold/30 bg-gold/[0.08] px-3.5 py-2 font-mono text-xs text-gold transition-all hover:bg-gold/15"
      >
        <Wallet size={13} />
        <span className="hidden sm:inline">{shortAddress(address)}</span>
        <span className="border-l border-gold/25 pl-2 font-semibold tabular-nums">
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
            className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-white/10 bg-panel p-4 shadow-panel-lift"
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
              {[
                { v: data.total.toLocaleString(), l: "Herd Pts", c: "text-gold" },
                { v: weeklyPoints.toLocaleString(), l: "This week", c: "text-bone" },
                { v: `#${rank}`, l: "Rank", c: "text-crimson-bright" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-white/[0.06] bg-surface/80 px-1 py-2.5">
                  <p className={cn("font-display text-base font-semibold", s.c)}>{s.v}</p>
                  <p className="mt-0.5 font-mono text-[9px] text-mist">{s.l}</p>
                </div>
              ))}
            </div>

            <div className="mt-3">
              <p className="flex items-center gap-1.5 font-mono text-[10px] text-mist">
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

            <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
              <a
                href="#herd"
                onClick={() => setOpen(false)}
                className="font-mono text-[10px] text-gold hover:text-gold-glow"
              >
                Leaderboard →
              </a>
              <button
                onClick={() => { disconnect(); setOpen(false); }}
                className="flex items-center gap-1 font-mono text-[10px] text-mist hover:text-crimson-bright"
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
  const [scrolled, setScrolled] = useState(false);
  const clicks = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <div
        className={cn(
          "mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 rounded-2xl border px-4 transition-all duration-300 sm:px-5",
          scrolled
            ? "nav-glass border-white/[0.08] shadow-float"
            : "border-transparent bg-transparent"
        )}
      >
        <a
          href="#top"
          className="flex shrink-0 items-center gap-2.5"
          onClick={(e) => {
            e.preventDefault();
            onLogoClick();
            document.getElementById("top")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <BullLogo glow className="h-9 w-9 transition-transform hover:scale-105" />
          <span className="hidden font-display text-[15px] font-semibold text-bone sm:inline">
            ANSEM<span className="text-gold"> Space</span>
          </span>
        </a>

        <PriceTicker />

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ash transition-colors hover:bg-white/[0.04] hover:text-bone"
            >
              {l.label}
            </a>
          ))}
          <a
            href={LINKS.creatorX}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 hidden rounded-lg border-l border-white/[0.06] pl-4 font-mono text-[10px] text-mist transition-colors hover:text-gold xl:inline"
          >
            𝕏 {CREATOR_HANDLE}
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <ProfileMenu />
          <button
            className="rounded-lg p-2 text-bone lg:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mx-auto mt-2 max-w-7xl overflow-hidden rounded-2xl border border-white/[0.08] bg-panel/95 p-4 shadow-panel-lift backdrop-blur-xl lg:hidden"
          >
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-3 py-3 text-sm font-medium text-bone hover:bg-white/[0.04]"
              >
                {l.label}
              </a>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}