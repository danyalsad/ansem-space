import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/** GET /api/polls — active community polls with vote counts. */
export async function GET() {
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ polls: [], source: "offline" });

  const { data: polls, error } = await sb
    .from("polls")
    .select("id, question, options, ends_at")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error || !polls?.length) {
    return NextResponse.json({ polls: [], source: "empty" });
  }

  const results = await Promise.all(
    polls.map(async (p) => {
      const { data: votes } = await sb.from("poll_votes").select("option_idx").eq("poll_id", p.id);
      const counts = (p.options as string[]).map((_, i) =>
        (votes ?? []).filter((v) => v.option_idx === i).length
      );
      const total = counts.reduce((a, b) => a + b, 0);
      return { ...p, counts, total };
    })
  );

  return NextResponse.json({ polls: results, source: "live" });
}

/** POST /api/polls — cast a vote. Body: { pollId, voter, optionIdx } */
export async function POST(req: Request) {
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ error: "offline" }, { status: 503 });

  const { pollId, voter, optionIdx } = await req.json();
  if (!pollId || !voter || typeof optionIdx !== "number") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const { error } = await sb.from("poll_votes").insert({ poll_id: pollId, voter, option_idx: optionIdx });

  if (error?.code === "23505") {
    return NextResponse.json({ error: "already voted" }, { status: 409 });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}