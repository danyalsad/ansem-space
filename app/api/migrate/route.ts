import { NextResponse } from "next/server";
import { Client } from "pg";

/**
 * POST /api/migrate — one-shot, idempotent schema setup for Supabase.
 * Runs on Vercel where POSTGRES_URL exists (values are Sensitive and can't
 * be pulled locally). Gated by MIGRATE_SECRET. Safe to call repeatedly.
 */

export const dynamic = "force-dynamic";

const SCHEMA_SQL = `
create extension if not exists pgcrypto;

create table if not exists players (
  wallet     text primary key,
  name       text not null default '',
  total      integer not null default 0,
  streak     integer not null default 0,
  badges     text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists weekly_points (
  wallet   text not null,
  week_key text not null,
  points   integer not null default 0,
  primary key (wallet, week_key)
);

create table if not exists memes (
  id         uuid primary key default gen_random_uuid(),
  image_url  text not null,
  caption    text not null default '',
  author     text not null default 'anon',
  votes      integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists meme_votes (
  meme_id uuid not null references memes(id) on delete cascade,
  voter   text not null,
  primary key (meme_id, voter)
);

-- Deny-all RLS: the anon key can touch nothing; the service key (API routes)
-- bypasses RLS. All client access goes through our /api endpoints.
alter table players enable row level security;
alter table weekly_points enable row level security;
alter table memes enable row level security;
alter table meme_votes enable row level security;

create index if not exists memes_created_idx on memes (created_at desc);
create index if not exists weekly_points_week_idx on weekly_points (week_key, points desc);
`;

export async function POST(req: Request) {
  if (req.headers.get("x-migrate-secret") !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const raw = process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
  if (!raw) return NextResponse.json({ error: "no postgres url in env" }, { status: 500 });

  // Supabase requires TLS but its chain isn't in the serverless trust store;
  // sslmode in the URL overrides the ssl option, so rewrite it there.
  const url = raw.includes("sslmode=")
    ? raw.replace(/sslmode=[^&]+/, "sslmode=no-verify")
    : `${raw}${raw.includes("?") ? "&" : "?"}sslmode=no-verify`;

  const body = await req.json().catch(() => ({}));

  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    if (body.action === "cleanup") {
      // Remove verification fixtures created during smoke tests.
      await client.query("delete from players where wallet = $1", [body.wallet ?? ""]);
      await client.query("delete from weekly_points where wallet = $1", [body.wallet ?? ""]);
      if (body.memeId) await client.query("delete from memes where id = $1", [body.memeId]);
      return NextResponse.json({ ok: true, action: "cleanup" });
    }
    await client.query(SCHEMA_SQL);
    const tables = await client.query(
      "select tablename from pg_tables where schemaname = 'public' order by tablename"
    );
    return NextResponse.json({ ok: true, tables: tables.rows.map((r) => r.tablename) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "migration failed" },
      { status: 500 }
    );
  } finally {
    await client.end().catch(() => {});
  }
}
