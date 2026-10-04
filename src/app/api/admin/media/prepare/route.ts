import { randomUUID } from "node:crypto";
import * as z from "zod";
import { requireAdmin } from "@/server/admin/auth";
import { mediaPrefix } from "@/server/admin/media";
import { parseBody, errorResponse, jsonResponse } from "@/server/http";
export async function POST(request: Request) {
  try {
    const actor = await requireAdmin();
    const { extension } = await parseBody(
      request,
      z
        .object({ extension: z.enum(["jpg", "jpeg", "png", "webp", "avif"]) })
        .strict(),
    );
    return jsonResponse({
      pathname: mediaPrefix(actor) + randomUUID() + "." + extension,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
