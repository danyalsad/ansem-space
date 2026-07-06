import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

/**
 * POST /api/memes/vote — { memeId, voter } — one vote per voter per meme,
 * enforced by the (meme_id, voter) primary key.
 */

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const memeId = String(body?.memeId ?? "");
  const voter = String(body?.voter ?? "").slice(0, 64);
  if (!memeId || !voter) return NextResponse.json({ error: "memeId and voter required" }, { status: 400 });

  const db = supabaseAdmin();

  const insert = await db.from("meme_votes").insert({ meme_id: memeId, voter });
  if (insert.error) {
    // 23505 = unique violation → already voted
    if (insert.error.code === "23505") {
      return NextResponse.json({ error: "already voted" }, { status: 409 });
    }
    return NextResponse.json({ error: insert.error.message }, { status: 500 });
  }

  // Recount from the votes table — self-healing against races.
  const { count } = await db
    .from("meme_votes")
    .select("*", { count: "exact", head: true })
    .eq("meme_id", memeId);
  const votes = (count ?? 0) + 1; // +1 for the poster's implicit self-vote
  await db.from("memes").update({ votes }).eq("id", memeId);

  return NextResponse.json({ ok: true, votes });
}
