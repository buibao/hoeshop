import * as z from "zod";
import { requireAdmin } from "@/server/admin/auth";
import { adminProductOptions } from "@/server/admin/repository";
import { errorResponse, jsonResponse } from "@/server/http";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const params = new URL(request.url).searchParams;
    const query = z.string().trim().max(200).parse(params.get("q") || "");
    const page = z.coerce.number().int().min(0).max(10000).parse(params.get("page") || 0);
    return jsonResponse(await adminProductOptions(query, page));
  } catch (error) { return errorResponse(error); }
}
