/**
 * Server-side Supabase client (service role — bypasses RLS).
 * NEVER import this from client components; the service key must stay in
 * API routes only. RLS is enabled deny-all on every table, so the anon key
 * can't read or write anything directly — all access flows through /api.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  if (!client) {
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

/** Base58 Solana address sanity check for user-supplied wallets. */
export function isValidWallet(w: unknown): w is string {
  return typeof w === "string" && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(w);
}
