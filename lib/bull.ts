/**
 * The Black Bull mark, as raw path data — shared by the SVG logo component
 * and the canvas renderers (meme templates, game, share cards).
 * Coordinate space: 100 x 100.
 */

export const BULL_HORN_LEFT = "M35 33 L14 25 L3 5 Q16 13 24 18 L38 27 Z";
export const BULL_HORN_RIGHT = "M65 33 L86 25 L97 5 Q84 13 76 18 L62 27 Z";
export const BULL_HEAD =
  "M33 29 L67 29 L78 45 L71 72 L58 87 L50 95 L42 87 L29 72 L22 45 Z";
export const BULL_EYE_LEFT = "M36 49 L46 53 L37 58 Z";
export const BULL_EYE_RIGHT = "M64 49 L54 53 L63 58 Z";
export const BULL_BLAZE = "M50 33 L53 45 L50 66 L47 45 Z";
export const BULL_NOSE = "M44 76 L50 80 L56 76 L50 84 Z";

/**
 * Draw the bull mark onto a canvas at (x, y) with the given size.
 * `variant` controls the fill treatment.
 */
export function drawBull(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  variant: "gold" | "dark" | "silhouette" = "gold"
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 100, size / 100);

  const horns = new Path2D(BULL_HORN_LEFT);
  const hornsR = new Path2D(BULL_HORN_RIGHT);
  const head = new Path2D(BULL_HEAD);
  const eyeL = new Path2D(BULL_EYE_LEFT);
  const eyeR = new Path2D(BULL_EYE_RIGHT);
  const blaze = new Path2D(BULL_BLAZE);
  const nose = new Path2D(BULL_NOSE);

  if (variant === "silhouette") {
    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.fill(horns);
    ctx.fill(hornsR);
    ctx.fill(head);
    ctx.restore();
    return;
  }

  const gold = "#FFD700";
  const dark = "#141317";

  ctx.fillStyle = gold;
  ctx.fill(horns);
  ctx.fill(hornsR);

  ctx.fillStyle = variant === "gold" ? dark : "#0A0A0A";
  ctx.fill(head);
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2.5;
  ctx.stroke(head);

  ctx.fillStyle = "#FF2E2E";
  ctx.fill(eyeL);
  ctx.fill(eyeR);

  ctx.fillStyle = gold;
  ctx.fill(blaze);
  ctx.fill(nose);

  ctx.restore();
}
