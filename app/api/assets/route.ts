import { NextResponse } from "next/server";
import { del, list, put } from "@vercel/blob";
import { verifyAdmin } from "@/lib/admin-auth";
import { ASSET_SLOTS } from "@/lib/asset-manifest";

/**
 * /api/assets — global site assets on Vercel Blob.
 *
 * GET    → public: { slots: { <slot>: { url, uploadedAt } }, library: [...] }
 * POST   → admin-only (wallet-signature, see lib/admin-auth): multipart upload.
 *          mode=slot   → overwrites slots/<slot>.png (stable URL, live in ≤5 min)
 *          mode=library→ adds to library/<category>/... (random suffix)
 * DELETE → admin-only: ?url=<blob url> (library items only)
 */

export const dynamic = "force-dynamic";

const VALID_SLOTS = new Set(ASSET_SLOTS.map((s) => s.slot));
const VALID_CATEGORIES = new Set(["sticker", "template", "background", "logo", "banner"]);
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB per upload keeps the free tier healthy

export async function GET() {
  const [slotBlobs, libBlobs] = await Promise.all([
    list({ prefix: "slots/" }),
    list({ prefix: "library/" }),
  ]);

  const slots: Record<string, { url: string; uploadedAt: string }> = {};
  for (const b of slotBlobs.blobs) {
    const slot = b.pathname.replace(/^slots\//, "").replace(/\.\w+$/, "");
    slots[slot] = { url: b.url, uploadedAt: String(b.uploadedAt) };
  }

  const library = libBlobs.blobs
    .map((b) => {
      const [, category = "sticker", ...rest] = b.pathname.split("/");
      return {
        url: b.url,
        pathname: b.pathname,
        category,
        name: rest.join("/").replace(/^\d+-/, "").replace(/\.\w+$/, ""),
        size: b.size,
        uploadedAt: String(b.uploadedAt),
      };
    })
    .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));

  return NextResponse.json({ slots, library });
}

export async function POST(req: Request) {
  const auth = verifyAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no file" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "file too large (max 4 MB)" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "images only" }, { status: 400 });

  const mode = String(form.get("mode") ?? "library");

  if (mode === "slot") {
    const slot = String(form.get("slot") ?? "");
    if (!VALID_SLOTS.has(slot)) return NextResponse.json({ error: "unknown slot" }, { status: 400 });
    // Fixed pathname + overwrite + short CDN cache = replacement goes live fast
    // at the same URL the site already references.
    const blob = await put(`slots/${slot}.png`, file, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 300,
      contentType: file.type,
    });
    return NextResponse.json({ ok: true, url: blob.url, slot });
  }

  const category = String(form.get("category") ?? "sticker");
  if (!VALID_CATEGORIES.has(category)) return NextResponse.json({ error: "unknown category" }, { status: 400 });
  const name = (String(form.get("name") ?? "") || file.name.replace(/\.\w+$/, ""))
    .replace(/[^\w\s-]/g, "")
    .slice(0, 48);
  const ext = (file.type.split("/")[1] ?? "png").replace("jpeg", "jpg");
  const blob = await put(`library/${category}/${Date.now()}-${name}.${ext}`, file, {
    access: "public",
    contentType: file.type,
  });
  return NextResponse.json({ ok: true, url: blob.url, category, name });
}

export async function DELETE(req: Request) {
  const auth = verifyAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const url = new URL(req.url).searchParams.get("url");
  if (!url || !url.includes("blob.vercel-storage.com/library/")) {
    return NextResponse.json({ error: "only library assets can be deleted" }, { status: 400 });
  }
  await del(url);
  return NextResponse.json({ ok: true });
}
