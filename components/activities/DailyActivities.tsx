"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Gift, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHerd } from "@/components/HerdProvider";
import { useWallet } from "@/components/WalletProvider";
import { trackQuestAction } from "@/lib/quests";
import { sfx } from "@/lib/arcade-audio";
import { fireConfetti } from "@/lib/confetti";
import {
  dailyDone,
  getDailyRiddle,
  loadDailyState,
  markDaily,
  rollSpin,
  SPIN_PRIZES,
  type DailyActivityId,
} from "@/lib/daily-activities";
import { cn } from "@/lib/utils";

export function DailyActivities() {
  const { grantBonus } = useHerd();
  const { address } = useWallet();
  const [done, setDone] = useState(loadDailyState);
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<string | null>(null);
  const [riddlePick, setRiddlePick] = useState<number | null>(null);
  const [riddleMsg, setRiddleMsg] = useState<string | null>(null);
  const riddle = getDailyRiddle();

  const refresh = useCallback(() => setDone(loadDailyState()), []);

  const claim = (id: DailyActivityId, hp: number, label: string) => {
    if (dailyDone(id)) return;
    markDaily(id);
    grantBonus(hp, label);
    trackQuestAction(address, "activity");
    sfx.powerup();
    fireConfetti({ count: hp >= 100 ? 100 : 50 });
    refresh();
  };

  const onSpin = () => {
    if (done.spin || spinning) return;
    setSpinning(true);
    setSpinResult(null);
    setTimeout(() => {
      const prize = rollSpin();
      setSpinResult(prize.label);
      claim("spin", prize.hp, "Daily spin");
      setSpinning(false);
    }, 2200);
  };

  const onGm = () => claim("gm", 30, "GM stamp");

  const onRiddle = (idx: number) => {
    if (done.riddle || riddlePick !== null) return;
    setRiddlePick(idx);
    if (idx === riddle.answer) {
      setRiddleMsg("Correct! +35 HP");
      claim("riddle", 35, "Bull riddle");
    } else {
      setRiddleMsg("Wrong — try again tomorrow");
      markDaily("riddle");
      refresh();
      sfx.miss();
    }
  };

  useEffect(() => {
    refresh();
  }, [refresh]);

  const completed = (["spin", "gm", "riddle"] as DailyActivityId[]).filter((k) => done[k]).length;

  return (
    <div className="mt-16">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-gold">Daily activities</p>
          <h3 className="font-display text-2xl font-bold text-bone">Earn without grinding</h3>
          <p className="mt-1 text-sm text-mist">Spin, GM stamp, and trivia — resets at midnight UTC</p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 font-mono text-xs text-ash">
          {completed}/3 done
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Spin */}
        <div className={cn("surface-card p-5", done.spin && "opacity-75")}>
          <div className="flex items-center gap-2">
            <Gift size={18} className="text-gold" />
            <h4 className="font-semibold text-bone">Bull Spin</h4>
          </div>
          <p className="mt-2 text-sm text-mist">One free spin per day · {SPIN_PRIZES.map((p) => p.label).join(" · ")}</p>
          <div className="relative mx-auto my-6 flex h-28 w-28 items-center justify-center">
            <motion.div
              animate={spinning ? { rotate: 720 } : { rotate: 0 }}
              transition={{ duration: 2.2, ease: [0.2, 0.8, 0.2, 1] }}
              className="flex h-full w-full items-center justify-center rounded-full border-2 border-gold/40 bg-gradient-to-br from-gold/20 to-crimson/10 text-3xl"
            >
              🐂
            </motion.div>
          </div>
          {spinResult && <p className="text-center font-display text-lg text-gold">{spinResult}</p>}
          <Button className="w-full" disabled={done.spin || spinning} onClick={onSpin}>
            {done.spin ? "✓ Spun today" : spinning ? "Spinning…" : "Spin the bull"}
          </Button>
        </div>

        {/* GM */}
        <div className={cn("surface-card p-5", done.gm && "opacity-75")}>
          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-gold" />
            <h4 className="font-semibold text-bone">GM Stamp</h4>
          </div>
          <p className="mt-2 text-sm text-mist">Tap once daily to stamp your attendance. +30 HP.</p>
          <button
            type="button"
            disabled={done.gm}
            onClick={onGm}
            className={cn(
              "mt-8 w-full rounded-2xl border py-12 text-2xl font-bold transition-all",
              done.gm
                ? "border-gold/30 bg-gold/10 text-gold"
                : "border-white/10 bg-panel hover:border-gold/30 hover:bg-gold/5 active:scale-[0.98]"
            )}
          >
            {done.gm ? "✓ GM stamped" : "GM herd 🐂"}
          </button>
        </div>

        {/* Riddle */}
        <div className={cn("surface-card p-5", done.riddle && "opacity-75")}>
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-gold" />
            <h4 className="font-semibold text-bone">Bull Riddle</h4>
          </div>
          <p className="mt-3 text-sm font-medium text-bone">{riddle.q}</p>
          <div className="mt-4 space-y-2">
            {riddle.choices.map((c, i) => (
              <button
                key={c}
                disabled={done.riddle && riddlePick === null}
                onClick={() => onRiddle(i)}
                className={cn(
                  "w-full rounded-xl border px-3 py-2.5 text-left text-sm transition-all",
                  riddlePick === i
                    ? i === riddle.answer
                      ? "border-green-500/40 bg-green-500/10 text-green-400"
                      : "border-crimson/40 bg-crimson/10 text-crimson-bright"
                    : "border-white/10 hover:border-gold/25"
                )}
              >
                {c}
              </button>
            ))}
          </div>
          {riddleMsg && <p className="mt-3 text-center text-xs text-gold">{riddleMsg}</p>}
          {done.riddle && !riddleMsg && <p className="mt-3 text-center text-xs text-mist">Come back tomorrow</p>}
        </div>
      </div>
    </div>
  );
}