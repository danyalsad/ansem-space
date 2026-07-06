/**
 * Server-side admin verification: the request must carry a message freshly
 * signed by the CREATOR_WALLET. No passwords, no sessions — the wallet IS
 * the credential.
 *
 * Client sends headers:
 *   x-admin-pubkey    — base58 wallet address (must equal CREATOR_WALLET)
 *   x-admin-message   — "ansem-space-admin|<unix ms>"
 *   x-admin-signature — base58 ed25519 signature of the message
 */

import nacl from "tweetnacl";
import bs58 from "bs58";
import { CREATOR_WALLET } from "@/lib/constants";

const MAX_AGE_MS = 10 * 60 * 1000;

export function verifyAdmin(req: Request): { ok: true } | { ok: false; error: string } {
  const pubkey = req.headers.get("x-admin-pubkey");
  const message = req.headers.get("x-admin-message");
  const signature = req.headers.get("x-admin-signature");

  if (!pubkey || !message || !signature) return { ok: false, error: "missing auth headers" };
  if (pubkey !== CREATOR_WALLET) return { ok: false, error: "not the creator wallet" };

  const [prefix, ts] = message.split("|");
  if (prefix !== "ansem-space-admin") return { ok: false, error: "bad message format" };
  const age = Date.now() - Number(ts);
  if (!Number.isFinite(age) || age < -60_000 || age > MAX_AGE_MS) {
    return { ok: false, error: "signature expired — try again" };
  }

  try {
    const valid = nacl.sign.detached.verify(
      new TextEncoder().encode(message),
      bs58.decode(signature),
      bs58.decode(pubkey)
    );
    if (!valid) return { ok: false, error: "invalid signature" };
  } catch {
    return { ok: false, error: "malformed signature" };
  }

  return { ok: true };
}
