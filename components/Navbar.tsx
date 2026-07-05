"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Wallet, X } from "lucide-react";
import { BullLogo } from "@/components/BullLogo";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/components/WalletProvider";
import { triggerBullCharge } from "@/lib/confetti";
import { cn, shortAddress } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#forge", label: "Forge" },
  { href: "#charge", label: "Charge" },
  { href: "#hands", label: "Hands" },
  { href: "#lore", label: "Lore" },
  { href: "#intel", label: "Intel" },
];

/** Simulated live price ticker — random walk, re-rolls every 3 seconds. */
function PriceTicker() {
  const [price, setPrice] = useState(0.004269);
  const [delta, setDelta] = useState(0.042);

  useEffect(() => {
    const id = setInterval(() => {
      setPrice((p) => {
        // Slight bullish drift, obviously.
        const move = p * (Math.random() * 0.03 - 0.013);
        const next = Math.max(0.0001, p + move);
        setDelta(move / p);
        return next;
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const up = delta >= 0;
  return (
    <div className="hidden items-center gap-2 font-mono text-xs md:flex" title="Simulated price">
      <span className="text-ash">$ANSEM</span>
      <motion.span
        key={price}
        initial={{ opacity: 0.4, y: up ? 6 : -6 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("tabular-nums", up ? "text-gold" : "text-crimson")}
      >
        ${price.toFixed(6)}
      </motion.span>
      <span className={cn("tabular-nums", up ? "text-gold" : "text-crimson")}>
        {up ? "▲" : "▼"} {Math.abs(delta * 100).toFixed(2)}%
      </span>
    </div>
  );
}

export function Navbar() {
  const { address, connecting, connect, disconnect } = useWallet();
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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-gold/15 bg-void/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Logo + wordmark */}
        <a
          href="#top"
          className="flex items-center gap-2.5"
          onClick={(e) => {
            e.preventDefault();
            onLogoClick();
            document.getElementById("top")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <BullLogo glow className="h-10 w-10 transition-transform hover:scale-110" />
          <span className="font-display text-sm uppercase tracking-widest text-bone">
            ANSEM<span className="text-gold"> Space</span>
          </span>
        </a>

        <PriceTicker />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3 py-2 font-display text-[11px] uppercase tracking-[0.2em] text-ash transition-colors hover:text-gold"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {address ? (
            <Button variant="outline" size="sm" onClick={disconnect} title="Click to disconnect">
              <Wallet size={14} />
              {shortAddress(address)}
            </Button>
          ) : (
            <Button size="sm" onClick={connect} disabled={connecting}>
              <Wallet size={14} />
              {connecting ? "Connecting…" : "Connect Wallet"}
            </Button>
          )}
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
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
