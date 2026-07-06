import { NextResponse } from "next/server";
import { isValidWallet, supabaseAdmin } from "@/lib/supabase-server";
import { weekKey } from "@/lib/points";

/**
 * /api/herd — the GLOBAL Herd Points leaderboard (Supabase-backed).
 *
 * GET  → { weekKey, allTime: [{wallet,name,total}], weekly: [{wallet,name,points}] }
 * POST → sync the caller's profile { wallet, name, total, weeklyPoints, streak, badges }
 *
 * Scores are client-computed (it's a community game, not a bank), but we
 * sanity-cap values and only accept well-formed Solana addresses.
 */

export const dynamic = "force-dynamic";

const MAX_TOTAL = 500_000;
const MAX_WEEKLY = 100_000;

export async function GET() {
  const db = supabaseAdmin();
  const wk = weekKey();

  const [allTimeRes, weeklyRes] = await Promise.all([
    db.from("players").select("wallet,name,total").order("total", { ascending: false }).limit(50),
    db
      .from("weekly_points")
      .select("wallet,points")
      .eq("week_key", wk)
      .order("points", { ascending: false })
      .limit(50),
  ]);

  if (allTimeRes.error || weeklyRes.error) {
    return NextResponse.json(
      { error: allTimeRes.error?.message ?? weeklyRes.error?.message },
      { status: 500 }
    );
  }

  // Resolve names for weekly rows from the players we already fetched.
  const names = new Map(allTimeRes.data.map((p) => [p.wallet, p.name]));
  const weekly = weeklyRes.data.map((w) => ({
    wallet: w.wallet,
    points: w.points,
    name: names.get(w.wallet) ?? `${w.wallet.slice(0, 4)}…${w.wallet.slice(-4)}`,
  }));

  return NextResponse.json({ weekKey: wk, allTime: allTimeRes.data, weekly });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !isValidWallet(body.wallet)) {
    return NextResponse.json({ error: "invalid wallet" }, { status: 400 });
  }

  const total = Math.min(Math.max(0, Math.floor(Number(body.total) || 0)), MAX_TOTAL);
  const weeklyPoints = Math.min(Math.max(0, Math.floor(Number(body.weeklyPoints) || 0)), MAX_WEEKLY);
  const streak = Math.min(Math.max(0, Math.floor(Number(body.streak) || 0)), 3650);
  const name = String(body.name ?? "").slice(0, 32) || `${body.wallet.slice(0, 4)}…${body.wallet.slice(-4)}`;
  const badges = Array.isArray(body.badges) ? body.badges.map(String).slice(0, 20) : [];

  const db = supabaseAdmin();
  const wk = weekKey();

  const [playerRes, weeklyRes] = await Promise.all([
    db.from("players").upsert(
      { wallet: body.wallet, name, total, streak, badges, updated_at: new Date().toISOString() },
      { onConflict: "wallet" }
    ),
    db.from("weekly_points").upsert(
      { wallet: body.wallet, week_key: wk, points: weeklyPoints },
      { onConflict: "wallet,week_key" }
    ),
  ]);

  if (playerRes.error || weeklyRes.error) {
    return NextResponse.json(
      { error: playerRes.error?.message ?? weeklyRes.error?.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
