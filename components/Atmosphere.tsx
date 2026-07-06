"use client";

/** Ambient depth — soft aurora, no cyber-grid clutter. */
export function Atmosphere({ variant = "default" }: { variant?: "default" | "hero" | "section" }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div
        className={
          variant === "hero"
            ? "absolute -left-[20%] top-[-10%] h-[70vmax] w-[70vmax] animate-aurora rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.14)_0%,transparent_62%)]"
            : "absolute left-1/2 top-0 h-[45vmax] w-[60vmax] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.05)_0%,transparent_65%)]"
        }
      />
      <div className="absolute -right-[15%] top-[20%] h-[50vmax] w-[50vmax] animate-aurora rounded-full bg-[radial-gradient(circle,rgba(200,16,46,0.07)_0%,transparent_60%)] [animation-delay:-6s]" />
      <div className="absolute bottom-0 left-1/2 h-[40vmax] w-[80vmax] -translate-x-1/2 translate-y-1/4 rounded-full bg-[radial-gradient(circle,rgba(40,30,60,0.4)_0%,transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(5,5,6,0.92)_100%)]" />
    </div>
  );
}