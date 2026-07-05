/**
 * Zero-dependency confetti + bull-charge celebration effects.
 * Confetti draws on a throwaway fixed canvas; the bull charge is dispatched
 * as a window event and rendered by <EffectsLayer />.
 */

const COLORS = ["#FFD700", "#FFE873", "#FF2E2E", "#EDE8DC", "#B8960B"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vr: number;
  shape: "rect" | "circle";
}

export function fireConfetti(opts: { count?: number; originY?: number } = {}) {
  if (typeof window === "undefined") return;
  const { count = 120, originY = 0.35 } = opts;

  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  const particles: Particle[] = Array.from({ length: count }, () => ({
    x: canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.5,
    y: canvas.height * originY,
    vx: (Math.random() - 0.5) * 14,
    vy: -Math.random() * 13 - 4,
    size: Math.random() * 8 + 4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.3,
    shape: Math.random() > 0.5 ? "rect" : "circle",
  }));

  let frames = 0;
  const maxFrames = 160;

  function tick() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      p.vy += 0.35; // gravity
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = Math.max(0, 1 - frames / maxFrames);
      ctx.fillStyle = p.color;
      if (p.shape === "rect") ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    frames++;
    if (frames < maxFrames) requestAnimationFrame(tick);
    else canvas.remove();
  }
  requestAnimationFrame(tick);
}

/** Trigger the full-screen bull stampede (handled by EffectsLayer). */
export function triggerBullCharge() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("ansem-bull-charge"));
}
