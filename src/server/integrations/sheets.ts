import { z } from "zod";
import { DomainError, type PublicComment, type Receipt, type CommentPage } from "@/domain/schemas";
import type { Repositories, Resource, WriteContext } from "@/server/repositories/contracts";
import { signEnvelope } from "./signing";
const publicCommentSchema = z.object({
  commentId: z.uuid(), postId: z.string(), displayName: z.string().min(1).max(80),
  body: z.string().min(1).max(1500), createdAt: z.iso.datetime(),
}).strict();
const receiptSchema = z.object({ requestId: z.uuid(), status: z.literal("received") }).strict();
const pageSchema = z.object({ comments: z.array(publicCommentSchema).max(20), nextCursor: z.uuid().nullable() }).strict();
export class SheetsRepository implements Repositories {
  private async call(payload: unknown): Promise<unknown> {
    const url = process.env.SHEETS_GATEWAY_URL, secret = process.env.SHEETS_GATEWAY_SECRET;
    if (!url || !secret) throw new DomainError(503, "NOT_CONFIGURED", "Hệ thống tiếp nhận đang được chuẩn bị. Vui lòng thử lại sau.");
    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signEnvelope(payload, secret)), cache: "no-store",
        signal: AbortSignal.timeout(15000), redirect: "follow",
      });
    } catch { throw new DomainError(503, "UPSTREAM_UNAVAILABLE", "Chưa xác nhận được việc lưu. Hãy thử lại; mã yêu cầu được giữ nguyên để tránh trùng."); }
    if (!response.ok) throw new DomainError(503, "UPSTREAM_UNAVAILABLE", "Hệ thống tiếp nhận tạm thời không khả dụng.");
    let result: { ok?: boolean; data?: unknown; code?: string; status?: number };
    try { result = await response.json(); } catch { throw new DomainError(503, "UPSTREAM_INVALID", "Chưa xác nhận được việc lưu yêu cầu."); }
    if (!result.ok) {
      if (result.code === "COMMENT_HIDDEN") throw new DomainError(409, "COMMENT_HIDDEN", "Bình luận này đã được shop ẩn sau đăng.");
      if (result.status === 409) throw new DomainError(409, "REQUEST_CONFLICT", "Mã yêu cầu đã được dùng cho nội dung khác. Hãy gửi lại với mã mới.");
      if (result.status === 429) throw new DomainError(429, "RATE_LIMITED", "Bạn đã gửi nhiều yêu cầu. Vui lòng chờ ít phút rồi thử lại.");
      if (result.status === 422) throw new DomainError(422, "INVALID_GATEWAY_INPUT", "Dữ liệu chưa hợp lệ. Hãy kiểm tra lại.");
      throw new DomainError(503, "UPSTREAM_UNAVAILABLE", "Hệ thống tiếp nhận tạm thời không khả dụng. Vui lòng thử lại.");
    }
    return result.data;
  }
  private async existing(resource: Resource, context: WriteContext): Promise<Receipt | null> {
    const value = await this.call({ action: "lookup", resource, ...context });
    return value === null ? null : receiptSchema.parse(value);
  }
  existingOrder(context: WriteContext) { return this.existing("Orders", context); }
  existingInquiry(context: WriteContext) { return this.existing("Inquiries", context); }
  async saveOrder(order: Parameters<Repositories["saveOrder"]>[0], context: WriteContext) {
    return receiptSchema.parse(await this.call({ action: "create", resource: "Orders", record: order, ...context }));
  }
  async saveInquiry(inquiry: Parameters<Repositories["saveInquiry"]>[0], context: WriteContext) {
    return receiptSchema.parse(await this.call({ action: "create", resource: "Inquiries", record: inquiry, ...context }));
  }
  async saveComment(comment: Parameters<Repositories["saveComment"]>[0], context: WriteContext): Promise<PublicComment> {
    return publicCommentSchema.parse(await this.call({ action: "create", resource: "Comments", record: comment, ...context }));
  }
  async listComments(postId: string, cursor: string | null): Promise<CommentPage> {
    return pageSchema.parse(await this.call({ action: "listComments", postId, cursor }));
  }
}
