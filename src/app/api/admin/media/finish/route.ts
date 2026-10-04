import * as z from "zod";
import { requireAdmin } from "@/server/admin/auth";
import { finishMedia } from "@/server/admin/media";
import { parseBody, errorResponse, jsonResponse } from "@/server/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const actor = await requireAdmin();
    const { url, alt } = await parseBody(
      request,
      z
        .object({ url: z.url(), alt: z.string().trim().min(1).max(500) })
        .strict(),
    );
    return jsonResponse({ row: await finishMedia(url, alt, actor) }, 201);
  } catch (e) {
    return errorResponse(e);
  }
}
