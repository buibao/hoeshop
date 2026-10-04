import { requireAdmin } from "@/server/admin/auth";
import { dashboard } from "@/server/admin/repository";
import { errorResponse, jsonResponse } from "@/server/http";
export async function GET() {
  try {
    await requireAdmin();
    return jsonResponse(await dashboard());
  } catch (e) {
    return errorResponse(e);
  }
}
