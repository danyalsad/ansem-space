import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { supabaseAdmin } from "@/lib/supabase-server";

/**
 * /api/memes — the GLOBAL community meme gallery.
 * Images live on Vercel Blob (memes/ prefix); metadata + votes in Supabase.
 *
 * GET  → { memes: [{id, imageUrl, caption, author, votes, createdAt}] }
 * POST → multipart { file, caption, author } — anyone can post (community
 *        gallery); size/type/length limits keep it sane.
 */

export const dynamic = "force-dynamic";

const MAX_BYTES = 2 * 1024 * 1024;

export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("memes")
    .select("id,image_url,caption,author,votes,created_at")
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    memes: data.map((m) => ({
      id: m.id,
      imageUrl: m.image_url,
      caption: m.caption,
      author: m.author,
      votes: m.votes,
      createdAt: m.created_at,
    })),
  });
}

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!form || !(file instanceof File)) {
    return NextResponse.json({ error: "no file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "max 2 MB" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "images only" }, { status: 400 });

  const caption = String(form.get("caption") ?? "").slice(0, 140);
  const author = (String(form.get("author") ?? "") || "anon").slice(0, 32);

  const ext = (file.type.split("/")[1] ?? "jpg").replace("jpeg", "jpg");
  const blob = await put(`memes/${Date.now()}.${ext}`, file, {
    access: "public",
    contentType: file.type,
  });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("memes")
    .insert({ image_url: blob.url, caption, author, votes: 1 })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id, imageUrl: blob.url });
}
