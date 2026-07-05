# 🐂 ANSEM Space — ansem.space

**Forge Memes. Charge Forward. Hold the Line.**

The community hub for **$ANSEM (The Black Bull)** on Solana.
Next.js 14 (App Router) · TypeScript · Tailwind CSS · framer-motion · shadcn-style UI.

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

**Recommended: Vercel (free tier is enough)**

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo. Vercel auto-detects Next.js; no config needed. Deploy.
3. In the Vercel project → **Settings → Domains** → add `ansem.space` and `www.ansem.space`.
4. At your domain registrar, set the DNS Vercel shows you:
   - `A` record for `ansem.space` → `76.76.21.21`
   - `CNAME` for `www` → `cname.vercel-dns.com`
5. Wait for DNS + automatic SSL. Done — every `git push` redeploys.

**Alternative: any Node host (VPS, Railway, Render)** — `npm run build && npm start` behind a reverse proxy on port 3000.

## What's inside

| Section | What it does |
|---|---|
| **The Forge** | Canvas meme generator (5 procedural Black Bull templates, fonts/colors/outline/glow, sticker upload, preset captions, PNG download, Share-to-X) + community gallery with upvotes & sorting (localStorage) |
| **Charge** | Endless-runner canvas game — jump paperhands 🧻 and bear traps 🐻, collect $ANSEM coins & SOL bags; pause/restart, high scores, leaderboard, daily challenges, Flex-on-X |
| **Hands** | Diamond-hands culture: animated holder stats, wallet-based grip score, "what if you held" calculator, Hall of Fame/Shame, shareable story-card generator |
| **Lore** | Interactive timeline of the $ANSEM saga with chapter modals, fake tweet embeds, and auto-playing Story Mode |
| **Intel** | Whale movement feed (Ansem highlighted), social sentiment gauge, holder bubblemap, Next Airdrop Predictor with community voting |

Plus: simulated live price ticker, simulated wallet connect (localStorage), confetti + bull-stampede celebrations, mobile floating CTA, and an easter egg (click the bull logo 5× fast 🐂💨).

## Honest notes

- All prices, stats, leaderboards, whale feeds and tweets are **simulated client-side** for entertainment. No real chain data, no backend, no cookies — persistence is localStorage only.
- This is a **community-built fan site**, not affiliated with Ansem (@blknoiz06). Not financial advice.
