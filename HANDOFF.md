# ANSEM Space — Session Handoff

> **RULE: This file MUST be updated at every commit and brought to the most
> recent state before pushing.** A stale handoff is worse than none — treat
> updating it as part of the commit, not an afterthought.

Last updated: 2026-07-06 · last commit `8f56863` ("Migrate route: force sslmode=no-verify in Postgres URL")

## What this is

Gamified community hub for the $ANSEM meme coin ("The Black Bull").
Live at **https://www.ansem.space** (apex 308-redirects to www).
Tagline: *Forge Memes. Charge Forward. Hold the Line.*

- Contract: `9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump` (Solana, pump.fun)
- Creator wallet (admin gate + footer credit): `3bdYdaDkjvKDST9zzjAZRpsodpd7DpU618QgMdpwtfWM`
- Creator X: https://x.com/DannyMD_UK — credited in navbar + footer

## Deploy model — IMPORTANT

- Repo: https://github.com/danyalsad/ansem-space (public), branch `main`
- Vercel is connected to GitHub: **`git push` to main auto-deploys production.**
  There is no manual deploy step. Never push half-finished work.
- Verify locally (`npm run build`, then exercise the changed routes) BEFORE pushing.

## Stack

Next.js 14 App Router · TypeScript · Tailwind (custom tokens: void/abyss/panel/edge/gold/crimson/bone/ash) · framer-motion · @solana/wallet-adapter (Phantom + Solflare, real mainnet connect) · Fonts: Unbounded / Chakra Petch / JetBrains Mono via next/font/google.

Data + infra:
- **DexScreener** (no key): price/mcap/volume/24h change/buys/sells — `components/MarketProvider.tsx`, 30s poll, deepest-liquidity pair.
- **Helius** (`HELIUS_API_KEY`): `/api/holders` (top-20 via getTokenLargestAccounts + owners) and `/api/whales` (Enhanced Transactions). Server-side only, memo-cached (120s/20s), labeled simulated fallback ONLY when Helius is unreachable — never when real data exists.
- **Vercel Blob** store `ansem-space-assets`, public base `https://mjx5wajkb2ytnn9l.public.blob.vercel-storage.com`. Asset slots live at stable paths `slots/<id>.png` (addRandomSuffix:false, allowOverwrite:true, cacheControlMaxAge:300) so admin uploads replace live assets with no redeploy. Community meme images go to `memes/`, free library to `library/<category>/`.
- **Supabase** (via Vercel Marketplace): tables `players`, `weekly_points`, `memes`, `meme_votes`. RLS enabled deny-all — all access goes through API routes using the service-role key (`lib/supabase-server.ts`).

## Environment variables (all on Vercel, Sensitive type)

**`vercel env pull` returns Sensitive values as EMPTY strings — by design, not a bug.**
Local copies of the ones we hold are in gitignored `.env.local`.

- `HELIUS_API_KEY` — Helius RPC + Enhanced API
- `MIGRATE_SECRET` — gates POST /api/migrate (value in `.env.local`)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY`), `POSTGRES_URL*` — injected by the Supabase integration; unpullable locally, so anything needing them must be tested against production/preview.
- `BLOB_READ_WRITE_TOKEN` — injected by the Blob store.

## Schema changes / migrations

No local DB access (Postgres URL is Sensitive). DDL runs through
`POST /api/migrate` with header `x-migrate-secret: $MIGRATE_SECRET`.
It is idempotent — safe to re-run. It also supports
`{"action":"cleanup","wallet":"…","memeId":"…"}` to remove smoke-test fixtures.

**Gotcha:** the Supabase cert chain isn't in the serverless trust store, and
`sslmode=require` in the connection string overrides pg's `ssl` option — the
route rewrites the URL to `sslmode=no-verify`. Don't remove that.

## Key files

- `lib/constants.ts` — CA, ticker, links, CREATOR_WALLET, shareOnX, LS keys
- `lib/palette.ts` — single source of color truth for ALL canvas renderers/logo/favicon (gold `#D4AF37`, crimson `#C8102E`; the original bright `#FFD700` was explicitly rejected — never reintroduce it)
- `lib/bull.ts` — shared bull-mark SVG path constants + `drawBull()`
- `lib/points.ts` — Herd Points engine: POINT_VALUES (meme 50, upvote 5, story 100, intel 20, game score÷50 max 400, daily 25+streak up to 50), badges, week keys, guest merge
- `lib/asset-manifest.ts` — 15 asset slots (branding / templates / game sprites / story) with names, descriptions, dimensions, live flags
- `lib/admin-auth.ts` — wallet-signature auth: message `ansem-space-admin|<unix ms>`, tweetnacl verify vs CREATOR_WALLET, 10-min freshness
- `lib/supabase-server.ts` — service-role client (server only) + wallet regex validator
- `app/api/` — `herd` (global leaderboard GET/POST, sanity caps), `memes` (+ `memes/vote`, 23505→409 one-vote-per-voter), `assets` (admin slot/library uploads), `holders`, `whales`, `migrate`
- `app/admin/page.tsx` — creator-wallet-gated asset manager (slot cards + free library). No footer link — navigate to /admin directly.
- `components/HerdProvider.tsx` — earn() + toasts, daily auto-claim, guest merge on connect, debounced (1.5s) auto-sync of connected wallets to /api/herd
- `components/sections/` — Forge (meme generator + GLOBAL gallery), Charge (runner game), Hands (real market stats, holder Diamond Division, sell Memorial), Herd (global + local-fallback leaderboards), Lore, Intel (whale feed, buy-pressure gauge, bubble map, predictor)

## Current state (all verified on production)

- v1→v5 shipped. Supabase live: migration returned all 4 tables; herd POST→GET→cleanup cycle passed; gallery post→Blob+DB passed; vote→2, duplicate vote→409.
- One intentional seed meme in the gallery ("GM herd — the global gallery is LIVE…" by "ANSEM Space").
- All simulated data removed except the labeled Helius-down fallback.
- SEO wired: OG image / favicon / X card read Blob slot URLs; robots disallows /admin + /api; sitemap live.

## Pending / next steps

1. **X (Twitter) login via Supabase Auth** — the reason Supabase was chosen. Needs Danny to create an X developer app for API keys, then wire the flow.
2. **Wire game sprites + story-card-bg into code** once Danny uploads them via /admin (slots `sprite-bull-runner`, `sprite-paperhand`, `sprite-beartrap`, `sprite-coin`, `sprite-solbag`, `story-card-bg` are marked live:false "wired on next site update").
3. Danny to replace placeholder branding assets (og-image, favicon, logo-bull, banner-x, meme templates) with high-quality versions via /admin.

## Working rules for this project

- Update THIS FILE at every commit (see rule at top).
- One verified push per feature batch — no half-finished multi-step pushes.
- Runtime-exercise changed code before pushing; `next build` passing is not enough.
- No blockquotes/decorative bars in text meant for Danny to copy-paste.
- Server routes must never expose the service-role key, MIGRATE_SECRET, or Helius key to the client.
