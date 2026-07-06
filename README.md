# 🐂 ANSEM Space — ansem.space

**Forge Memes. Charge Forward. Hold the Line.**

The gamified community hub for **$ANSEM (The Black Bull)** on Solana.
Next.js 14 (App Router) · TypeScript · Tailwind CSS · framer-motion · Solana wallet-adapter · shadcn-style UI.

Contract: `9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump`

---

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Production build / serve:

```bash
npm run build
npm start
```

## Deploy to ansem.space

The repo is connected to Vercel — **every `git push` to `main` auto-deploys** to www.ansem.space.

Optional env vars (Vercel → Settings → Environment Variables):

| Var | Purpose |
|---|---|
| `HELIUS_API_KEY` | Unlocks real holder/whale data in `/api/holders` and `/api/whales` (TODO blocks are marked in those routes; the key never reaches the client) |

## What's inside

| Section | What it does |
|---|---|
| **The Forge** | Canvas meme generator — 5 procedural Black Bull templates **+ upload your own template images**, fonts/colors/outline/glow, sticker overlays, preset captions, PNG download, Share-to-X. Community gallery with upvotes & sorting. Posting +50 HP, upvoting +5 HP |
| **Charge** | Endless-runner — jump paperhands 🧻 and bear traps 🐻, collect coins & SOL bags with floating "+100" feedback; pause/restart, high scores, daily challenges, leaderboard. Every run pays Herd Points (score ÷ 50, max 400) |
| **The Herd** | **Gamification hub** — all-time + weekly leaderboards, your profile (HP, rank, streak), ways-to-earn guide, and 8 unlockable badges (Meme Lord, Bull Runner, Lore Keeper, Diamond Hands…) |
| **Hands** | **Live market stats via DexScreener** (price, market cap, 24h volume, 24h change), wallet-based grip score, "what if you held" calculator on the real price, Halls of Fame/Shame, shareable story cards |
| **Lore** | Interactive timeline with chapter modals and auto-playing Story Mode (+100 HP on completion) |
| **Intel** | Whale feed + holder bubblemap served by `/api/whales` and `/api/holders` (simulated today, Helius-ready), sentiment gauge, Next Airdrop Predictor (+20 HP) |

### Systems

- **Real wallet connection** — `@solana/wallet-adapter` (Phantom, Solflare, any Wallet-Standard wallet). The navbar shows your address, HP balance, rank and badges; guest progress merges into your wallet profile on first connect.
- **Herd Points** — persisted in localStorage keyed by wallet address (`lib/points.ts`); daily login bonus (+25 HP, streak up to +50) awards automatically once per day.
- **Live price ticker** — DexScreener public API, polled every 30 s, graceful fallback if unreachable.
- **Admin asset manager** — `/admin`, unlocks for the creator wallet only; upload templates/logos/banners/backgrounds. `lib/assets.ts` is async-shaped so storage can move from localStorage to Vercel Blob without UI changes.
- Confetti + bull-stampede celebrations, mobile floating CTA, 5×-click logo easter egg.

## Honest notes

- Market data (price, market cap, volume, 24h change) is **real, via DexScreener**. Leaderboard competitors, whale feed, holder map, grip scores and halls are **simulated** until the Helius integration lands — each is labeled in the UI.
- Points/badges live in the browser's localStorage (per device). A server-backed global leaderboard is the natural next step.
- Community-built fan site, not affiliated with Ansem (@blknoiz06). Not financial advice.

## Credits

Built for the $ANSEM community by [@DannyMD_UK](https://x.com/DannyMD_UK) · `3bdYdaDkjvKDST9zzjAZRpsodpd7DpU618QgMdpwtfWM`
