"use client";

import { useEffect, useState } from "react";
import {
  BULL_BLAZE,
  BULL_EYE_LEFT,
  BULL_EYE_RIGHT,
  BULL_HEAD,
  BULL_HORN_LEFT,
  BULL_HORN_RIGHT,
  BULL_NOSE,
} from "@/lib/bull";
import { slotUrl } from "@/lib/asset-manifest";
import { CRIMSON_BRIGHT, GOLD, PANEL } from "@/lib/palette";
import { cn } from "@/lib/utils";

function BullSvg({ className, glow }: { className?: string; glow?: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("h-9 w-9", glow && "drop-shadow-[0_0_16px_rgba(212,175,55,0.6)]", className)}
      aria-hidden
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

/** The Black Bull mark — loads logo-bull slot from Blob, SVG fallback. */
export function BullLogo({
  className,
  glow = false,
  useSlot = true,
}: {
  className?: string;
  glow?: boolean;
  /** false = always inline SVG (tiny icons) */
  useSlot?: boolean;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!useSlot) return;
    fetch("/api/assets")
      .then((r) => r.json())
      .then((j) => {
        const slot = j.slots?.["logo-bull"];
        if (slot?.url) setSrc(`${slot.url}?v=${slot.uploadedAt}`);
        else setSrc(slotUrl("logo-bull"));
      })
      .catch(() => setSrc(slotUrl("logo-bull")));
  }, [useSlot]);

  if (!useSlot || failed || !src) {
    return <BullSvg className={className} glow={glow} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="ANSEM Black Bull"
      role="img"
      className={cn(
        "object-contain",
        glow && "drop-shadow-[0_0_20px_rgba(212,175,55,0.55)]",
        className
      )}
      onError={() => setFailed(true)}
    />
  );
}