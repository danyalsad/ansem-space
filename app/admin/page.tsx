"use client";

/**
 * /admin — site-owner asset manager.
 * Unlocks only when the connected wallet matches CREATOR_WALLET.
 * Upload meme templates, logos, banners and backgrounds; template/background
 * uploads appear instantly in the Forge's template picker.
 *
 * Storage is localStorage today (per-browser). lib/assets.ts is async-shaped
 * so this can move to Vercel Blob + /api/assets without UI changes.
 */

import { useEffect, useState, type ChangeEvent } from "react";
import { motion } from "framer-motion";
import { ImagePlus, Lock, ShieldCheck, Trash2, Wallet } from "lucide-react";
import { BullLogo } from "@/components/BullLogo";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/components/WalletProvider";
import {
  deleteAsset,
  fileToDataUrl,
  listAssets,
  saveAsset,
  type AssetCategory,
  type SiteAsset,
} from "@/lib/assets";
import { CREATOR_WALLET } from "@/lib/constants";
import { cn, shortAddress } from "@/lib/utils";

const CATEGORIES: Array<{ id: AssetCategory; label: string }> = [
  { id: "template", label: "Meme templates" },
  { id: "background", label: "Backgrounds" },
  { id: "logo", label: "Logos" },
  { id: "banner", label: "Banners" },
];

export default function AdminPage() {
  const { address, connect, connecting } = useWallet();
  const isOwner = address === CREATOR_WALLET;

  const [assets, setAssets] = useState<SiteAsset[]>([]);
  const [category, setCategory] = useState<AssetCategory>("template");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listAssets().then(setAssets);
  }, []);

  async function onUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || busy) return;
    setBusy(true);
    try {
      const dataUrl = await fileToDataUrl(file, category === "banner" ? 1600 : 1080);
      await saveAsset(name || file.name.replace(/\.\w+$/, ""), category, dataUrl);
      setAssets(await listAssets());
      setName("");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  async function onDelete(id: string) {
    await deleteAsset(id);
    setAssets(await listAssets());
  }

  return (
    <main className="min-h-screen bg-void px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl">
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
            <h1 className="font-display text-xl uppercase tracking-widest text-bone">
              Restricted area
            </h1>
            <p className="max-w-sm text-sm text-ash">
              The asset manager unlocks for the site creator's wallet
              ({shortAddress(CREATOR_WALLET, 5)}). Connect to verify.
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
            <p className="mt-1 text-xs text-ash">
              Template + background uploads appear immediately in the Forge template picker.
              Stored locally for now — swap lib/assets.ts to Vercel Blob for global assets.
            </p>

            {/* Upload panel */}
            <div className="mt-6 grid gap-3 border border-gold/25 bg-panel p-5 sm:grid-cols-[1fr_auto_auto]">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Asset name (optional)"
                className="border border-edge bg-void px-3 py-2.5 text-sm text-bone outline-none placeholder:text-ash/50 focus:border-gold/60"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AssetCategory)}
                className="border border-edge bg-void px-3 py-2.5 text-sm text-bone outline-none focus:border-gold/60"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              <label className={cn(
                "flex cursor-pointer items-center justify-center gap-2 border border-gold/40 px-5 py-2.5 font-display text-xs uppercase tracking-wider text-gold transition-all hover:bg-gold/10",
                busy && "pointer-events-none opacity-50"
              )}>
                <ImagePlus size={14} /> {busy ? "Uploading…" : "Upload"}
                <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
              </label>
            </div>

            {/* Asset grid by category */}
            {CATEGORIES.map((c) => {
              const items = assets.filter((a) => a.category === c.id);
              if (items.length === 0) return null;
              return (
                <div key={c.id} className="mt-8">
                  <h2 className="font-display text-xs uppercase tracking-[0.25em] text-ash">
                    {c.label} · {items.length}
                  </h2>
                  <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {items.map((a) => (
                      <div key={a.id} className="group relative border border-edge bg-panel">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.dataUrl} alt={a.name} className="aspect-square w-full object-cover" />
                        <div className="flex items-center justify-between gap-2 border-t border-edge px-2 py-1.5">
                          <span className="truncate font-mono text-[10px] text-ash">{a.name}</span>
                          <button
                            onClick={() => onDelete(a.id)}
                            className="text-ash transition-colors hover:text-crimson-bright"
                            aria-label={`Delete ${a.name}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {assets.length === 0 && (
              <p className="mt-10 text-center font-mono text-xs text-ash">
                No assets yet — upload your first template above.
              </p>
            )}
          </motion.div>
        )}
      </div>
    </main>
  );
}
