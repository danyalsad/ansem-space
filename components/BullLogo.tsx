import {
  BULL_BLAZE,
  BULL_EYE_LEFT,
  BULL_EYE_RIGHT,
  BULL_HEAD,
  BULL_HORN_LEFT,
  BULL_HORN_RIGHT,
  BULL_NOSE,
} from "@/lib/bull";
import { cn } from "@/lib/utils";

/** The Black Bull mark — angular, cyber, gold-horned, crimson-eyed. */
export function BullLogo({
  className,
  glow = false,
}: {
  className?: string;
  glow?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("h-9 w-9", glow && "drop-shadow-[0_0_12px_rgba(255,215,0,0.5)]", className)}
      aria-label="ANSEM Black Bull logo"
      role="img"
    >
      <path d={BULL_HORN_LEFT} fill="#FFD700" />
      <path d={BULL_HORN_RIGHT} fill="#FFD700" />
      <path d={BULL_HEAD} fill="#141317" stroke="#FFD700" strokeWidth="2.5" />
      <path d={BULL_EYE_LEFT} fill="#FF2E2E" />
      <path d={BULL_EYE_RIGHT} fill="#FF2E2E" />
      <path d={BULL_BLAZE} fill="#FFD700" />
      <path d={BULL_NOSE} fill="#FFD700" />
    </svg>
  );
}
