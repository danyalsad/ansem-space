# ANSEM Space — Session Handoff

> **RULE: This file MUST be updated at every commit and brought to the most
> recent state before pushing.** A stale handoff is worse than none — treat
> updating it as part of the commit, not an afterthought.

Last updated: 2026-07-06 · v10 design system overhaul (2026 visual refresh)

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

Next.js 14 App Router · TypeScript · Tailwind (void/abyss/panel/surface/edge/gold/crimson/bone/ash/mist) · framer-motion · @solana/wallet-adapter · Fonts: Bricolage Grotesque / Plus Jakarta Sans / IBM Plex Mono via next/font/google.

Data + infra:
- **DexScreener** (no key): price/mcap/volume/24h change/buys/sells — `components/MarketProvider.tsx`, 30s poll, deepest-liquidity pair.
- **Helius** (`HELIUS_API_KEY`): `/api/holders` (top-20 via getTokenLargestAccounts + owners) and `/api/whales` (Enhanced Transactions). Server-side only, memo-cached (120s/20s), labeled simulated fallback ONLY when Helius is unreachable — never when real data exists.
- **Vercel Blob** store `ansem-space-assets`, public base `https://mjx5wajkb2ytnn9l.public.blob.vercel-storage.com`. Asset slots live at stable paths `slots/<id>.png` (addRandomSuffix:false, allowOverwrite:true, cacheControlMaxAge:300) so admin uploads replace live assets with no redeploy. Community meme images go to `memes/`, free library to `library/<category>/`.
- **Supabase** (via Vercel Marketplace): tables `players`, `weekly_points`, `memes`, `meme_votes`, `polls`, `poll_votes`, `referrals`, `referral_signups`. RLS enabled deny-all — all access goes through API routes using the service-role key (`lib/supabase-server.ts`).

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

- `lib/constants.ts` — CA, ticker, links, CREATOR_WALLET, CREATOR_NAME/HANDLE/TAGLINE/STORY, shareOnX (appends creator credit), LS keys
- `lib/quests.ts` — 5 daily + 5 weekly quests, progress tracking, claim rewards, daily-challenge HP marker
- `lib/referrals.ts` — referral codes, tiered rewards (1/3/5/10 recruits), ?ref= capture
- `lib/palette.ts` — single source of color truth for ALL canvas renderers/logo/favicon (gold `#D4AF37`, crimson `#C8102E`; the original bright `#FFD700` was explicitly rejected — never reintroduce it)
- `lib/bull.ts` — shared bull-mark SVG path constants + `drawBull()`
- `lib/points.ts` — Herd Points engine: POINT_VALUES (meme 50, upvote 5, story 100, intel 20, share 15, game score÷50 max 400, daily 25+streak up to 70 + milestone bonuses at 7/14/30 days), 14 badges, quest progress on PlayerData, week keys, guest merge
- `lib/asset-manifest.ts` — 15 asset slots (all live), SLOT_USAGE map for /admin, permanent Blob URLs
- `scripts/seed-assets.mjs` — regenerates + uploads all slot PNGs (`npm run seed-assets`, needs BLOB_READ_WRITE_TOKEN)
- `lib/admin-auth.ts` — wallet-signature auth: message `ansem-space-admin|<unix ms>`, tweetnacl verify vs CREATOR_WALLET, 10-min freshness
- `lib/supabase-server.ts` — service-role client (server only) + wallet regex validator
- `app/api/` — `herd`, `memes` (+ `memes/vote`), `polls` (global community polls), `referrals` (signup + code registration), `assets`, `holders`, `whales`, `migrate`
- `app/admin/page.tsx` — creator-wallet-gated asset manager (slot cards + free library). No footer link — navigate to /admin directly.
- `components/HerdProvider.tsx` — earn() + grantBonus() + toasts, quest progress on earn, daily auto-claim, guest merge, debounced Supabase sync
- `components/Atmosphere.tsx` — global cinematic background layers
- `components/ui/Panel.tsx` — rounded glass panels (gold/crimson/glass + gradient-border variant)
- `app/globals.css` — surface-card, gradient-border, section-shell utilities; aurora bg (no cyber-grid clutter)
- `components/CreatorSpotlight.tsx` — "Built by Dr Danny" hero banner + Hall of Builders (#builders)
- `components/AchievementRoadmap.tsx` — visual HP milestones + badge progress grid
- `components/sections/Charge.tsx` — Arcade hub: Charge runner, Bull Tap, Hold the Line; shared stampede board
- `lib/arcade-audio.ts` — Web Audio synth SFX (jump, coin, combo, powerup, near-miss, diamond/paper) shared across arcade games
- `components/games/ChargeRunner.tsx` — endless runner: market zones (bull→meme→bear), parallax skyline, dip/pump/whale/flybear entities, near-miss + milestone bonuses, synth sfx
- `components/games/BullTap.tsx` — 30s reflex tap: streak multipliers, frenzy mode (last 5s 2×), candle chart backdrop
- `components/games/HoldTheLine.tsx` — diamond-hands hold/release with live chart canvas, zone pulse sfx
- `lib/games.ts` — per-game highs + unified leaderboard (`game` field on scores)
- `components/sections/` — Forge (+ weekly Meme Battle contest banner), Charge (Arcade), Quests (daily/weekly missions, referrals, roadmap), Herd, Hands, Lore, Intel (global poll via /api/polls, local fallback)

## Current state (all verified on production)

- v1→v5 shipped. Supabase live: migration returned all 4 tables; herd POST→GET→cleanup cycle passed; gallery post→Blob+DB passed; vote→2, duplicate vote→409.
- One intentional seed meme in the gallery ("GM herd — the global gallery is LIVE…" by "ANSEM Space").
- All simulated data removed except the labeled Helius-down fallback.
- SEO wired: OG image / favicon / X card read Blob slot URLs; robots disallows /admin + /api; sitemap live.

## Pending / next steps

1. **Run migration** after deploy: `POST /api/migrate` to create `polls`, `poll_votes`, `referrals`, `referral_signups` tables (seeds default airdrop poll).
2. **X (Twitter) login via Supabase Auth** — needs X developer app API keys.
3. **Wire game sprites + story-card-bg** once uploaded via /admin.
4. Replace placeholder branding assets via /admin.
5. **Phase 2 (optional):** server-trusted point events, NFT badge mints, realtime presence, governance proposals, X feed embed.

## Working rules for this project

- Update THIS FILE at every commit (see rule at top).
- One verified push per feature batch — no half-finished multi-step pushes.
- Runtime-exercise changed code before pushing; `next build` passing is not enough.
- No blockquotes/decorative bars in text meant for Danny to copy-paste.
- Server routes must never expose the service-role key, MIGRATE_SECRET, or Helius key to the client.
