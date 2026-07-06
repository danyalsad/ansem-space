/**
 * Asset manifest — every visual asset slot the site uses.
 *
 * Slots live at permanent Blob URLs (`slots/<id>.png`). Uploading to a slot
 * from /admin OVERWRITES the same URL, so replacements go live everywhere
 * within ~5 minutes (CDN cache) — no redeploy needed for slots marked "live".
 */

export const BLOB_BASE = "https://mjx5wajkb2ytnn9l.public.blob.vercel-storage.com";

export const slotUrl = (slot: string) => `${BLOB_BASE}/slots/${slot}.png`;

export type SlotGroup = "branding" | "template" | "sprite" | "card";

export interface AssetSlot {
  slot: string;
  name: string;
  description: string;
  spec: string;
  group: SlotGroup;
  /** true = the site reads this URL already; false = I wire it in a follow-up update once uploaded */
  live: boolean;
}

export const ASSET_SLOTS: AssetSlot[] = [
  /* ---------- Branding & SEO (live immediately) ---------- */
  {
    slot: "og-image",
    name: "Social share card (OpenGraph)",
    description:
      "The image shown when ansem.space is linked on X, Telegram or Discord. Dark bull artwork + 'ANSEM Space' wordmark reads best. This is the site's single most-seen asset.",
    spec: "1200×630 · PNG/JPG · < 1 MB",
    group: "branding",
    live: true,
  },
  {
    slot: "favicon",
    name: "Favicon (browser tab icon)",
    description: "Bull mark on dark background, bold and readable at 16px. Keep it simple — no text.",
    spec: "512×512 · PNG · square",
    group: "branding",
    live: true,
  },
  {
    slot: "logo-bull",
    name: "Primary Black Bull logo",
    description:
      "The master bull mark for marketing, X avatar and future in-site use. Transparent background, centered, generous padding.",
    spec: "1024×1024+ · PNG · transparent",
    group: "branding",
    live: true,
  },
  {
    slot: "banner-x",
    name: "X / community banner",
    description: "Wide banner for the X community profile and promo posts. Wordmark left, bull right works well.",
    spec: "1500×500 · PNG/JPG",
    group: "branding",
    live: true,
  },

  /* ---------- Forge meme templates (live immediately in the generator) ---------- */
  {
    slot: "template-golden-charge",
    name: "Meme template — Golden Charge",
    description: "Bull charging through a golden glow with speed lines. Replaces the procedurally-drawn version in the Forge.",
    spec: "1080×1080 · JPG/PNG",
    group: "template",
    live: true,
  },
  {
    slot: "template-red-candle-god",
    name: "Meme template — Red Candle God",
    description: "Bull surfing a giant vertical green candle over a rising chart.",
    spec: "1080×1080 · JPG/PNG",
    group: "template",
    live: true,
  },
  {
    slot: "template-moon-mission",
    name: "Meme template — Moon Mission",
    description: "Bull tilted mid-charge toward a big moon, starfield behind.",
    spec: "1080×1080 · JPG/PNG",
    group: "template",
    live: true,
  },
  {
    slot: "template-paperhands-down",
    name: "Meme template — Paperhands Down",
    description: "Crimson hazard-stripe scene, scattered REKT/NGMI text, triumphant bull front and center.",
    spec: "1080×1080 · JPG/PNG",
    group: "template",
    live: true,
  },
  {
    slot: "template-blank-void",
    name: "Meme template — Blank Void",
    description: "Minimal dark canvas with gold frame and faint bull silhouette — the 'write anything' template.",
    spec: "1080×1080 · JPG/PNG",
    group: "template",
    live: true,
  },

  /* ---------- Charge game sprites (live in Charge canvas) ---------- */
  {
    slot: "sprite-bull-runner",
    name: "Game sprite — running bull",
    description: "The player character in Charge. MUST FACE RIGHT. Clean silhouette reads best at small size.",
    spec: "256×256 · PNG · transparent",
    group: "sprite",
    live: true,
  },
  {
    slot: "sprite-paperhand",
    name: "Game obstacle — paperhands",
    description: "Replaces the 🧻 emoji obstacle. Something jumpable-looking: toilet-paper hands, tissue ghost, etc.",
    spec: "256×256 · PNG · transparent",
    group: "sprite",
    live: true,
  },
  {
    slot: "sprite-beartrap",
    name: "Game obstacle — bear trap",
    description: "Replaces the 🐻 emoji obstacle. A low, wide bear/trap shape.",
    spec: "256×256 · PNG · transparent",
    group: "sprite",
    live: true,
  },
  {
    slot: "sprite-coin",
    name: "Game collectible — $ANSEM coin",
    description: "Gold coin with the bull or 'A'. Replaces the drawn gold circle.",
    spec: "256×256 · PNG · transparent",
    group: "sprite",
    live: true,
  },
  {
    slot: "sprite-solbag",
    name: "Game collectible — SOL bag",
    description: "Replaces the 💰 emoji. A money bag / SOL-branded sack.",
    spec: "256×256 · PNG · transparent",
    group: "sprite",
    live: true,
  },

  /* ---------- Share cards ---------- */
  {
    slot: "story-card-bg",
    name: "Diamond-hands story card background",
    description: "Background for the shareable 'My Diamond Hands Story' cards generated in the Hands section.",
    spec: "1200×675 · JPG/PNG · dark, low-contrast center",
    group: "card",
    live: true,
  },
];

/** Where each slot is consumed — shown in /admin for Danny. */
export const SLOT_USAGE: Record<string, string> = {
  "og-image": "layout.tsx · OpenGraph / X cards",
  favicon: "layout.tsx · browser tab + apple icon",
  "logo-bull": "BullLogo · Hero · Navbar · Effects",
  "banner-x": "X community profile (download & upload to X)",
  "template-golden-charge": "Forge meme generator",
  "template-red-candle-god": "Forge meme generator",
  "template-moon-mission": "Forge meme generator",
  "template-paperhands-down": "Forge meme generator",
  "template-blank-void": "Forge meme generator",
  "sprite-bull-runner": "Charge game · player character",
  "sprite-paperhand": "Charge game · obstacle",
  "sprite-beartrap": "Charge game · obstacle",
  "sprite-coin": "Charge game · collectible",
  "sprite-solbag": "Charge game · collectible",
  "story-card-bg": "Hands · diamond-hands share cards",
};

export const SLOT_GROUP_LABELS: Record<SlotGroup, string> = {
  branding: "Branding & SEO",
  template: "Forge meme templates",
  sprite: "Charge game sprites",
  card: "Share cards",
};
