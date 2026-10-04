import * as z from "zod";
import { DomainError } from "@/domain/schemas";
export async function parseBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw new DomainError(
      400,
      "INVALID_CONTENT_TYPE",
      "Yêu cầu phải dùng JSON.",
    );
  const origin = request.headers.get("origin");
  if (
    origin &&
    origin !== new URL(request.url).origin &&
    origin !== process.env.SITE_URL
  )
    throw new DomainError(400, "INVALID_ORIGIN", "Nguồn yêu cầu không hợp lệ.");
  const reader = request.body?.getReader();
  if (!reader)
    throw new DomainError(400, "INVALID_JSON", "Thiếu dữ liệu yêu cầu.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 65536) {
      await reader.cancel();
      throw new DomainError(
        422,
        "BODY_TOO_LARGE",
        "Yêu cầu quá dài. Vui lòng rút gọn nội dung.",
      );
    }
    chunks.push(value);
  }
  let input: unknown;
  try {
    input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new DomainError(400, "INVALID_JSON", "Dữ liệu JSON không hợp lệ.");
  }
  return schema.parse(input);
}
export const jsonResponse = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
export function errorResponse(error: unknown) {
  if (error instanceof z.ZodError)
    return jsonResponse(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Vui lòng kiểm tra các trường thông tin.",
          fields: error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
      },
      422,
    );
  if (error instanceof DomainError)
    return jsonResponse(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      error.status,
    );
  if (dbErrorCode(error) === "23505")
    return jsonResponse(
      {
        error: {
          code: "CONTENT_CONFLICT",
          message: "ID hoặc đường dẫn này đã tồn tại. Chọn đường dẫn khác nhé.",
        },
      },
      409,
    );
  // Never expose raw upstream errors or customer data.
  return jsonResponse(
    {
      error: {
        code: "UNAVAILABLE",
        message: "Chưa xác nhận được yêu cầu. Vui lòng thử lại sau.",
      },
    },
    503,
  );
}
function dbErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return;
  if ("code" in error && typeof error.code === "string") return error.code;
  if ("cause" in error) return dbErrorCode(error.cause);
}
