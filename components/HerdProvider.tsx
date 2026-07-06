"use client";

/**
 * Herd Points context: exposes the player's profile (points, badges, rank,
 * streak) and an earn() function every feature calls to award points.
 * Renders the floating "+X HP" toast stack and badge-unlock celebrations.
 * Progress is keyed by wallet address; guest progress merges on connect.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWallet } from "@/components/WalletProvider";
import {
  awardPoints,
  computeRank,
  loadPlayer,
  mergeGuestInto,
  weekKey,
  type Badge,
  type EarnAction,
  type PlayerData,
} from "@/lib/points";
import { fireConfetti } from "@/lib/confetti";

interface Toast {
  id: number;
  text: string;
  kind: "points" | "badge";
}

interface HerdState {
  data: PlayerData;
  weeklyPoints: number;
  rank: number;
  weeklyRank: number;
  earn: (action: EarnAction, meta?: { score?: number }) => { gained: number; newBadges: Badge[] };
}

const HerdContext = createContext<HerdState | null>(null);

export function HerdProvider({ children }: { children: ReactNode }) {
  const { address } = useWallet();
  const [data, setData] = useState<PlayerData>(() => loadPlayer(null));
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const mergedFor = useRef<string | null>(null);

  const pushToast = useCallback((text: string, kind: Toast["kind"] = "points") => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-3), { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "badge" ? 5200 : 3200);
  }, []);

  const earn = useCallback(
    (action: EarnAction, meta: { score?: number } = {}) => {
      const result = awardPoints(address, action, meta);
      setData(result.data);
      if (result.gained > 0) pushToast(`+${result.gained} HP · ${result.label}`);
      for (const badge of result.newBadges) {
        pushToast(`Badge unlocked: ${badge.emoji} ${badge.name}`, "badge");
      }
      if (result.newBadges.length > 0) fireConfetti({ count: 110 });
      return { gained: result.gained, newBadges: result.newBadges };
    },
    [address, pushToast]
  );

  // On wallet connect: merge guest progress, reload profile, claim daily.
  useEffect(() => {
    if (address && mergedFor.current !== address) {
      mergedFor.current = address;
      mergeGuestInto(address);
    }
    setData(loadPlayer(address));
    // Daily login bonus (no-op if already claimed today).
    const t = setTimeout(() => earn("daily"), 1200);
    return () => clearTimeout(t);
  }, [address, earn]);

  const weeklyPoints = data.weekly[weekKey()] ?? 0;

  return (
    <HerdContext.Provider
      value={{
        data,
        weeklyPoints,
        rank: computeRank(data.total),
        weeklyRank: computeRank(data.total, "weekly", weeklyPoints),
        earn,
      }}
    >
      {children}

      {/* Toast stack */}
      <div className="pointer-events-none fixed right-4 top-20 z-[120] flex flex-col items-end gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className={
                t.kind === "badge"
                  ? "border border-gold bg-panel px-4 py-3 font-display text-xs uppercase tracking-wider text-gold shadow-gold-glow"
                  : "border border-gold/40 bg-void/95 px-3.5 py-2 font-mono text-xs text-gold"
              }
            >
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </HerdContext.Provider>
  );
}

export function useHerd(): HerdState {
  const ctx = useContext(HerdContext);
  if (!ctx) throw new Error("useHerd must be used inside HerdProvider");
  return ctx;
}
