/**
 * Community asset store: meme templates, logos, banners, backgrounds.
 *
 * Currently localStorage-backed (per-browser). The API is intentionally
 * async so it can be swapped for Vercel Blob without touching callers:
 *   - listAssets()  → GET  /api/assets        (Blob list)
 *   - saveAsset()   → POST /api/assets        (Blob put, admin-gated)
 *   - deleteAsset() → DELETE /api/assets/[id] (Blob del, admin-gated)
 */

import { store } from "@/lib/utils";

export type AssetCategory = "template" | "logo" | "banner" | "background";

export interface SiteAsset {
  id: string;
  name: string;
  category: AssetCategory;
  dataUrl: string;
  ts: number;
}

const KEY = "ansem_assets";
const MAX_ASSETS = 24; // keep localStorage under quota

export async function listAssets(category?: AssetCategory): Promise<SiteAsset[]> {
  const all = store.get<SiteAsset[]>(KEY, []);
  return category ? all.filter((a) => a.category === category) : all;
}

export async function saveAsset(
  name: string,
  category: AssetCategory,
  dataUrl: string
): Promise<SiteAsset> {
  const asset: SiteAsset = {
    id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: name || "Untitled",
    category,
    dataUrl,
    ts: Date.now(),
  };
  const all = store.get<SiteAsset[]>(KEY, []);
  store.set(KEY, [asset, ...all].slice(0, MAX_ASSETS));
  return asset;
}

export async function deleteAsset(id: string): Promise<void> {
  const all = store.get<SiteAsset[]>(KEY, []);
  store.set(
    KEY,
    all.filter((a) => a.id !== id)
  );
}

/** Downscale + compress an uploaded file so it fits comfortably in storage. */
export function fileToDataUrl(file: File, maxDim = 1080): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas unavailable"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = reject;
    img.src = url;
  });
}
