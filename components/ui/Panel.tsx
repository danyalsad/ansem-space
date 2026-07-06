import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type PanelVariant = "default" | "gold" | "crimson" | "glass";

const variants: Record<PanelVariant, string> = {
  default: "border-white/[0.06] bg-surface/90",
  gold: "gradient-border bg-panel/95 shadow-gold-glow",
  crimson: "border-crimson/25 bg-panel/95",
  glass: "border-white/[0.08] bg-panel/50 backdrop-blur-xl",
};

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
        "relative rounded-2xl border shadow-panel",
        variants[variant],
        glow && "before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-gold/[0.06] before:via-transparent before:to-crimson/[0.03]",
        className
      )}
    >
      {children}
    </div>
  );
}