import { requireAdmin } from "@/server/admin/auth";
import { adminContactSettings, adminSaveContactSettings } from "@/server/admin/repository";
import { contactEditSchema } from "@/domain/contact";
import { errorResponse, jsonResponse, parseBody } from "@/server/http";
export const runtime = "nodejs";
export async function GET() {
  try { await requireAdmin(); return jsonResponse(await adminContactSettings()); }
  catch (error) { return errorResponse(error); }
}
export async function PATCH(request: Request) {
  try {
    const actor = await requireAdmin();
    return jsonResponse(await adminSaveContactSettings(await parseBody(request, contactEditSchema), actor));
  } catch (error) { return errorResponse(error); }
}
