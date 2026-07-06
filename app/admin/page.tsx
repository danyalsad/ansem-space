"use client";

/**
 * /admin — site-owner asset manager (creator wallet only).
 *
 * Lists every asset slot the site uses (name, description, exact specs) with
 * per-slot upload. Slot uploads go to PERMANENT Blob URLs the site already
 * references, so replacements appear everywhere within ~5 minutes.
 * Uploads are authorized by signing a message with the creator wallet —
 * verified server-side in /api/assets.
 */

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { motion } from "framer-motion";
import bs58 from "bs58";
import { CheckCircle2, Clock, ImagePlus, Lock, ShieldCheck, Trash2, Wallet } from "lucide-react";
import { BullLogo } from "@/components/BullLogo";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/components/WalletProvider";
import {
  ASSET_SLOTS,
  SLOT_GROUP_LABELS,
  type SlotGroup,
} from "@/lib/asset-manifest";
import { CREATOR_WALLET } from "@/lib/constants";
import { cn, shortAddress } from "@/lib/utils";

interface SlotState {
  url: string;
  uploadedAt: string;
}
interface LibraryItem {
  url: string;
  pathname: string;
  category: string;
  name: string;
}

const LIBRARY_CATEGORIES = ["sticker", "template", "background", "logo", "banner"] as const;

export default function AdminPage() {
  const { address, connect, connecting, signMessage } = useWallet();
  const isOwner = address === CREATOR_WALLET;

  const [slots, setSlots] = useState<Record<string, SlotState>>({});
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [busySlot, setBusySlot] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [libCategory, setLibCategory] = useState<(typeof LIBRARY_CATEGORIES)[number]>("sticker");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/assets");
      const json = await res.json();
      setSlots(json.slots ?? {});
      setLibrary(json.library ?? []);
    } catch {
      setStatus("Could not load assets");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Sign a fresh admin message with the creator wallet. */
  async function adminHeaders(): Promise<Record<string, string>> {
    if (!address || !signMessage) throw new Error("Wallet can't sign messages");
    const message = `ansem-space-admin|${Date.now()}`;
    const sig = await signMessage(new TextEncoder().encode(message));
    return {
      "x-admin-pubkey": address,
      "x-admin-message": message,
      "x-admin-signature": bs58.encode(sig),
    };
  }

  async function uploadSlot(slot: string, file: File) {
    setBusySlot(slot);
    setStatus("");
    try {
      const headers = await adminHeaders();
      const form = new FormData();
      form.set("file", file);
      form.set("mode", "slot");
      form.set("slot", slot);
      const res = await fetch("/api/assets", { method: "POST", headers, body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "upload failed");
      setStatus(`✓ ${slot} updated — live everywhere within ~5 minutes`);
      await refresh();
    } catch (e) {
      setStatus(`✗ ${e instanceof Error ? e.message : "upload failed"}`);
    } finally {
      setBusySlot(null);
    }
  }

  async function uploadLibrary(file: File) {
    setBusySlot("library");
    setStatus("");
    try {
      const headers = await adminHeaders();
      const form = new FormData();
      form.set("file", file);
      form.set("mode", "library");
      form.set("category", libCategory);
      const res = await fetch("/api/assets", { method: "POST", headers, body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "upload failed");
      setStatus(`✓ added to ${libCategory} library`);
      await refresh();
    } catch (e) {
      setStatus(`✗ ${e instanceof Error ? e.message : "upload failed"}`);
    } finally {
      setBusySlot(null);
    }
  }

  async function deleteLibrary(url: string) {
    try {
      const headers = await adminHeaders();
      const res = await fetch(`/api/assets?url=${encodeURIComponent(url)}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await refresh();
    } catch (e) {
      setStatus(`✗ ${e instanceof Error ? e.message : "delete failed"}`);
    }
  }

  const onSlotFile = (slot: string) => (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) uploadSlot(slot, f);
    e.target.value = "";
  };

  const groups: SlotGroup[] = ["branding", "template", "sprite", "card"];

  return (
    <main className="min-h-screen bg-void px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <a href="/" className="flex w-fit items-center gap-2.5">
          <BullLogo glow className="h-10 w-10" />
          <span className="font-display text-sm uppercase tracking-widest text-bone">
            ANSEM<span className="text-gold"> Space</span> <span className="text-ash">/ admin</span>
          </span>
        </a>

        {!isOwner ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-16 flex flex-col items-center gap-4 border border-edge bg-panel px-6 py-14 text-center"
          >
            <Lock size={32} className="text-crimson-bright" />
            <h1 className="font-display text-xl uppercase tracking-widest text-bone">Restricted area</h1>
            <p className="max-w-sm text-sm text-ash">
              The asset manager unlocks for the site creator's wallet ({shortAddress(CREATOR_WALLET, 5)}).
              Connect to verify.
            </p>
            {address ? (
              <p className="font-mono text-xs text-crimson-bright">
                Connected as {shortAddress(address)} — not the creator wallet.
              </p>
            ) : (
              <Button onClick={connect} disabled={connecting}>
                <Wallet size={14} /> {connecting ? "Connecting…" : "Connect wallet"}
              </Button>
            )}
            <a href="/" className="mt-2 font-mono text-xs text-gold hover:text-gold-glow">
              ← Back to ANSEM Space
            </a>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-10">
            <div className="flex items-center gap-2 text-gold">
              <ShieldCheck size={18} />
              <h1 className="font-display text-lg uppercase tracking-widest">Asset manager</h1>
            </div>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-ash">
              Every asset slot the site uses, with exact specs. Uploads overwrite a permanent URL and go
              live for all visitors within ~5 minutes — each upload asks your wallet for one signature.
            </p>
            {status && (
              <p className={cn("mt-3 font-mono text-xs", status.startsWith("✓") ? "text-gold" : "text-crimson-bright")}>
                {status}
              </p>
            )}

            {/* ---------------- Slot groups ---------------- */}
            {groups.map((group) => (
              <section key={group} className="mt-10">
                <h2 className="font-display text-xs uppercase tracking-[0.25em] text-crimson-bright">
                  {SLOT_GROUP_LABELS[group]}
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {ASSET_SLOTS.filter((s) => s.group === group).map((s) => {
                    const current = slots[s.slot];
                    return (
                      <div key={s.slot} className="flex gap-4 border border-edge bg-panel p-4">
                        {/* Preview */}
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden border border-edge bg-void">
                          {current ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={`${current.url}?v=${current.uploadedAt}`}
                              alt={s.name}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <span className="font-mono text-[9px] text-ash/50">empty</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-display text-[11px] uppercase tracking-wide text-bone">
                              {s.name}
                            </h3>
                            {s.live ? (
                              <span className="flex shrink-0 items-center gap-1 font-mono text-[9px] uppercase text-gold" title="The site reads this URL right now">
                                <CheckCircle2 size={10} /> live
                              </span>
                            ) : (
                              <span className="flex shrink-0 items-center gap-1 font-mono text-[9px] uppercase text-ash" title="Upload now — wired into the site in the next update">
                                <Clock size={10} /> next update
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] leading-snug text-ash">{s.description}</p>
                          <p className="mt-1.5 font-mono text-[10px] text-gold-dim">{s.spec}</p>
                          <label
                            className={cn(
                              "mt-2.5 inline-flex cursor-pointer items-center gap-1.5 border border-gold/40 px-3 py-1.5 font-display text-[10px] uppercase tracking-wider text-gold transition-all hover:bg-gold/10",
                              busySlot === s.slot && "pointer-events-none opacity-50"
                            )}
                          >
                            <ImagePlus size={11} />
                            {busySlot === s.slot ? "Uploading…" : current ? "Replace" : "Upload"}
                            <input type="file" accept="image/*" className="hidden" onChange={onSlotFile(s.slot)} />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}

            {/* ---------------- Free library ---------------- */}
            <section className="mt-12 border-t border-edge pt-8">
              <h2 className="font-display text-xs uppercase tracking-[0.25em] text-crimson-bright">
                Asset library — stickers &amp; extras
              </h2>
              <p className="mt-1 text-[11px] text-ash">
                Anything else: sticker packs for the Forge, extra templates, alt logos. Stickers and
                templates appear in every visitor's meme generator.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <select
                  value={libCategory}
                  onChange={(e) => setLibCategory(e.target.value as (typeof LIBRARY_CATEGORIES)[number])}
                  className="border border-edge bg-void px-3 py-2.5 text-sm text-bone outline-none focus:border-gold/60"
                >
                  {LIBRARY_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-2 border border-gold/40 px-5 py-2.5 font-display text-xs uppercase tracking-wider text-gold transition-all hover:bg-gold/10",
                    busySlot === "library" && "pointer-events-none opacity-50"
                  )}
                >
                  <ImagePlus size={14} /> {busySlot === "library" ? "Uploading…" : "Upload to library"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadLibrary(f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>

              {library.length > 0 && (
                <div className="mt-6 grid grid-cols-3 gap-4 sm:grid-cols-5">
                  {library.map((a) => (
                    <div key={a.pathname} className="border border-edge bg-panel">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.url} alt={a.name} className="aspect-square w-full object-contain p-1" />
                      <div className="flex items-center justify-between gap-1 border-t border-edge px-2 py-1.5">
                        <span className="truncate font-mono text-[9px] text-ash" title={a.name}>
                          {a.category}/{a.name}
                        </span>
                        <button
                          onClick={() => deleteLibrary(a.url)}
                          className="text-ash transition-colors hover:text-crimson-bright"
                          aria-label={`Delete ${a.name}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </motion.div>
        )}
      </div>
    </main>
  );
}
