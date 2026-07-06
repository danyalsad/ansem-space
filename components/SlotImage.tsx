"use client";

import { useState, type ReactNode } from "react";
import { slotUrl } from "@/lib/asset-manifest";
import { cn } from "@/lib/utils";

/**
 * Renders an asset slot from Vercel Blob with optional cache-bust from /api/assets.
 * Falls back to children (usually inline SVG) when the image fails to load.
 */
export function SlotImage({
  slot,
  alt,
  className,
  bust,
  fallback,
}: {
  slot: string;
  alt: string;
  className?: string;
  /** uploadedAt timestamp for cache busting */
  bust?: string;
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const src = bust ? `${slotUrl(slot)}?v=${bust}` : slotUrl(slot);

  if (failed) return <>{fallback}</>;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn(className)}
      onError={() => setFailed(true)}
    />
  );
}