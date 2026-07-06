"use client";

/** Global ambient layers — depth, grid, vignette. Sits behind all content. */
export function Atmosphere({ variant = "default" }: { variant?: "default" | "hero" | "section" }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {/* Molten core */}
      <div
        className={
          variant === "hero"
            ? "absolute left-1/2 top-[20%] h-[80vmax] w-[80vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.14)_0%,transparent_55%)]"
            : "absolute left-1/2 top-0 h-[50vmax] w-[70vmax] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.06)_0%,transparent_60%)]"
        }
      />
      {/* Crimson underglow */}
      <div className="absolute bottom-0 left-1/2 h-[45vmax] w-[90vmax] -translate-x-1/2 translate-y-1/3 rounded-full bg-[radial-gradient(circle,rgba(200,16,46,0.08)_0%,transparent_65%)]" />
      {/* Cyber grid */}
      <div className="absolute inset-0 bg-grid opacity-[0.35]" />
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(10,10,10,0.85)_100%)]" />
      {variant === "hero" && (
        <div className="absolute inset-x-0 h-32 animate-scanline bg-gradient-to-b from-transparent via-gold/[0.05] to-transparent" />
      )}
    </div>
  );
}