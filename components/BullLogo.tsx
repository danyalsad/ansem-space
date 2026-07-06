import {
  BULL_BLAZE,
  BULL_EYE_LEFT,
  BULL_EYE_RIGHT,
  BULL_HEAD,
  BULL_HORN_LEFT,
  BULL_HORN_RIGHT,
  BULL_NOSE,
} from "@/lib/bull";
import { CRIMSON_BRIGHT, GOLD, PANEL } from "@/lib/palette";
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
      className={cn("h-9 w-9", glow && "drop-shadow-[0_0_12px_rgba(212,175,55,0.55)]", className)}
      aria-label="ANSEM Black Bull logo"
      role="img"
    >
      <path d={BULL_HORN_LEFT} fill={GOLD} />
      <path d={BULL_HORN_RIGHT} fill={GOLD} />
      <path d={BULL_HEAD} fill={PANEL} stroke={GOLD} strokeWidth="2.5" />
      <path d={BULL_EYE_LEFT} fill={CRIMSON_BRIGHT} />
      <path d={BULL_EYE_RIGHT} fill={CRIMSON_BRIGHT} />
      <path d={BULL_BLAZE} fill={GOLD} />
      <path d={BULL_NOSE} fill={GOLD} />
    </svg>
  );
}
