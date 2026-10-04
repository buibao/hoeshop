import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { z } from "zod";
import { requireAdmin } from "@/server/admin/auth";
import { mediaPrefix, MEDIA_LIMIT, MEDIA_TYPES } from "@/server/admin/media";
import { assertDbEnvironment } from "@/server/db";
import { DomainError } from "@/domain/schemas";
import { parseBody, errorResponse, jsonResponse } from "@/server/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const actor = await requireAdmin();
    await assertDbEnvironment();
    if (!process.env.BLOB_READ_WRITE_TOKEN)
      throw new DomainError(
        503,
        "BLOB_NOT_CONFIGURED",
        "Thư viện ảnh chưa được kết nối.",
      );
    const body = (await parseBody(
      request,
      z.object({
        type: z.literal("blob.generate-client-token"),
        payload: z
          .object({
            pathname: z.string().max(250),
            callbackUrl: z.string().optional(),
            multipart: z.boolean().optional(),
            clientPayload: z.string().nullable().optional(),
          })
          .passthrough(),
      }),
    )) as HandleUploadBody;
    return jsonResponse(
      await handleUpload({
        request,
        body,
        onBeforeGenerateToken: async (pathname) => {
          if (
            !pathname.startsWith(mediaPrefix(actor)) ||
            !/^hoe\/[a-f0-9]{24}\/[a-f0-9-]{36}\.(jpg|jpeg|png|webp|avif)$/.test(
              pathname,
            )
          )
            throw new DomainError(
              422,
              "MEDIA_PATH",
              "Tên ảnh tải lên không hợp lệ.",
            );
          return {
            allowedContentTypes: MEDIA_TYPES,
            maximumSizeInBytes: MEDIA_LIMIT,
            validUntil: Date.now() + 600000,
            addRandomSuffix: false,
            allowOverwrite: false,
          };
        },
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
