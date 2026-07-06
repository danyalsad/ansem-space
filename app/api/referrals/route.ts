import { NextResponse } from "next/server";
import { supabaseAdmin, isValidWallet } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/** POST /api/referrals — record a referral signup. Body: { referee, referrerCode } */
export async function POST(req: Request) {
  const sb = supabaseAdmin();
  const { referee, referrerCode } = await req.json();

  if (!isValidWallet(referee) || !referrerCode || typeof referrerCode !== "string") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  // Offline mode — client handles locally
  if (!sb) {
    return NextResponse.json({ ok: true, mode: "local" });
  }

  // Find referrer by code
  const { data: referrer } = await sb
    .from("referrals")
    .select("wallet, recruits")
    .eq("code", referrerCode.toUpperCase())
    .maybeSingle();

  if (!referrer || referrer.wallet === referee) {
    return NextResponse.json({ error: "invalid referrer" }, { status: 400 });
  }

  // Check duplicate
  const { data: existing } = await sb
    .from("referral_signups")
    .select("referee")
    .eq("referee", referee)
    .maybeSingle();

  if (existing) return NextResponse.json({ error: "already referred" }, { status: 409 });

  const { error: signupErr } = await sb.from("referral_signups").insert({
    referee,
    referrer_wallet: referrer.wallet,
    referrer_code: referrerCode.toUpperCase(),
  });

  if (signupErr) return NextResponse.json({ error: signupErr.message }, { status: 500 });

  // Bump referrer recruit count
  await sb
    .from("referrals")
    .update({ recruits: (referrer.recruits ?? 0) + 1, updated_at: new Date().toISOString() })
    .eq("wallet", referrer.wallet);

  return NextResponse.json({
    ok: true,
    refereeHp: 50,
    referrerHp: 75,
    referrerWallet: referrer.wallet,
  });
}

/** PUT /api/referrals — register or fetch referral code. Body: { wallet } */
export async function PUT(req: Request) {
  const sb = supabaseAdmin();
  const { wallet } = await req.json();

  if (!isValidWallet(wallet)) {
    return NextResponse.json({ error: "invalid wallet" }, { status: 400 });
  }

  if (!sb) {
    const code = wallet.slice(2, 8).toUpperCase();
    return NextResponse.json({ code, recruits: 0, mode: "local" });
  }

  const code = wallet.slice(2, 8).toUpperCase();

  const { data, error } = await sb
    .from("referrals")
    .upsert({ wallet, code, recruits: 0, updated_at: new Date().toISOString() }, { onConflict: "wallet" })
    .select("code, recruits")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ code: data.code, recruits: data.recruits });
}