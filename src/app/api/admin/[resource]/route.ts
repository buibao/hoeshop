import { requireAdmin } from "@/server/admin/auth";
import { resourceSchema } from "@/server/admin/schemas";
import { adminList } from "@/server/admin/repository";
import { errorResponse, jsonResponse } from "@/server/http";
import { z } from "zod";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  context: { params: Promise<{ resource: string }> },
) {
  try {
    await requireAdmin();
    const { resource } = await context.params;
    const query = new URL(request.url).searchParams,
      page = z.coerce
        .number()
        .int()
        .min(0)
        .max(10000)
        .parse(query.get("page") || 0);
    const rows = await adminList(
      resourceSchema.parse(resource),
      undefined,
      page,
      query.get("status") || undefined,
    );
    return jsonResponse({
      rows: rows.slice(0, 50),
      hasMore: rows.length > 50,
      page,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
