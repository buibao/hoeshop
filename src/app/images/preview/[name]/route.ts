import fs from "node:fs/promises";
import path from "node:path";
import { isTestContent } from "@/server/content";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!isTestContent() || !["bouquet.jpg", "roses.jpg", "peonies.jpg"].includes(name)) return new Response("Not found", { status: 404 });
  try {
    const image = await fs.readFile(path.join(process.cwd(), "tests/fixtures/images", name));
    return new Response(image, { headers: { "Content-Type": "image/jpeg", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  } catch { return new Response("Not found", { status: 404 }); }
}
