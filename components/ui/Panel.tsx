import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type PanelVariant = "default" | "gold" | "crimson" | "glass";

const variants: Record<PanelVariant, string> = {
  default: "border-edge bg-panel/90",
  gold: "border-gold/35 bg-panel/95 shadow-gold-glow",
  crimson: "border-crimson/35 bg-panel/95",
  glass: "border-white/[0.06] bg-panel/60 backdrop-blur-xl",
};

/** Premium horn-clipped panel — the core surface of ANSEM Space v7. */
export function Panel({
  children,
  className,
  variant = "default",
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  variant?: PanelVariant;
  glow?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative border shadow-panel horn-clip",
        variants[variant],
        glow && "before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-br before:from-gold/[0.07] before:via-transparent before:to-crimson/[0.04]",
        className
      )}
    >
      {children}
    </div>
  );
}