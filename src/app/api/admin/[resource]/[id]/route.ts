import { requireAdmin } from "@/server/admin/auth";
import { resourceSchema, editSchema } from "@/server/admin/schemas";
import { adminList, adminSave } from "@/server/admin/repository";
import { errorResponse, jsonResponse, parseBody } from "@/server/http";
import { deleteMedia } from "@/server/admin/media";
import { z } from "zod";
import { DomainError } from "@/domain/schemas";
export const runtime = "nodejs";
type Context = { params: Promise<{ resource: string; id: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    await requireAdmin();
    const { resource, id } = await context.params;
    return jsonResponse({
      rows: await adminList(resourceSchema.parse(resource), id),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function PUT(request: Request, context: Context) {
  try {
    const actor = await requireAdmin();
    const { resource, id } = await context.params;
    const input = await parseBody(request, editSchema);
    return jsonResponse({
      row: await adminSave(
        resourceSchema.parse(resource),
        id,
        input.editVersion,
        input.data,
        actor,
      ),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function DELETE(request: Request, context: Context) {
  try {
    const actor = await requireAdmin();
    const { resource, id } = await context.params;
    if (resource !== "media")
      throw new DomainError(
        422,
        "ARCHIVE_REQUIRED",
        "Chuyển nội dung sang lưu trữ để giữ lịch sử.",
      );
    await parseBody(request, z.object({ confirm: z.literal(true) }).strict());
    return jsonResponse(await deleteMedia(z.uuid().parse(id), actor));
  } catch (e) {
    return errorResponse(e);
  }
}
