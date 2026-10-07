import * as z from "zod";
import { requireAdmin } from "@/server/admin/auth";
import { adminHomeSelection, adminSaveHomeSelection } from "@/server/admin/repository";
import { selectionKinds, selectionSchema } from "@/domain/home-products";
import { errorResponse, jsonResponse, parseBody } from "@/server/http";
export const runtime = "nodejs";
type Context = { params: Promise<{ kind: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    await requireAdmin();
    const kind = z.enum(selectionKinds).parse((await context.params).kind);
    return jsonResponse(await adminHomeSelection(kind));
  } catch (error) { return errorResponse(error); }
}
export async function PATCH(request: Request, context: Context) {
  try {
    const actor = await requireAdmin();
    const kind = z.enum(selectionKinds).parse((await context.params).kind);
    const input = await parseBody(request, selectionSchema(kind));
    return jsonResponse(await adminSaveHomeSelection(kind, input, actor));
  } catch (error) { return errorResponse(error); }
}
