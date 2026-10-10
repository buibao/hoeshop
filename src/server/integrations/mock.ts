import { DomainError, type PublicComment, type Receipt } from "@/domain/schemas";
import type { Repositories, Resource, WriteContext } from "@/server/repositories/contracts";
type Entry = { hash: string; data: Receipt | PublicComment; hidden?: boolean };
type State = { entries: Map<string, Entry>; rates: Map<string, { count: number; until: number }> };
const globals = globalThis as typeof globalThis & { hoeMock?: State };
function state() { return globals.hoeMock ||= { entries: new Map(), rates: new Map() }; }
export class MockRepository implements Repositories {
  private existing(resource: Resource, context: WriteContext) {
    const entry = state().entries.get(resource + ":" + context.requestId);
    if (entry && entry.hash !== context.payloadHash) throw new DomainError(409, "REQUEST_CONFLICT", "Mã yêu cầu đã được dùng cho nội dung khác.");
    return entry?.data ?? null;
  }
  private save(resource: Resource, context: WriteContext, data: Receipt | PublicComment) {
    const found = this.existing(resource, context);
    if (found) return found;
    const key = resource + ":" + context.rateKey;
    const now = Date.now();
    for (const [k, v] of state().rates) if (v.until <= now) state().rates.delete(k);
    const rate = state().rates.get(key) ?? { count: 0, until: now + (resource === "Comments" ? 60000 : 600000) };
    if (rate.count >= 5) throw new DomainError(429, "RATE_LIMITED", "Bạn đã gửi nhiều yêu cầu. Vui lòng chờ rồi thử lại.");
    rate.count++; state().rates.set(key, rate);
    state().entries.set(resource + ":" + context.requestId, { hash: context.payloadHash, data });
    return data;
  }
  async existingOrder(context: WriteContext) { return this.existing("Orders", context) as Receipt | null; }
  async existingInquiry(context: WriteContext) { return this.existing("Inquiries", context) as Receipt | null; }
  async saveOrder(_order: Parameters<Repositories["saveOrder"]>[0], context: WriteContext) {
    const recurringItems = _order.items.filter((i) => i.configuration.serviceType === "hoa-thoi").map((i) => ({ name: i.name, quantity: i.quantity, configuration: i.configuration }));
    return this.save("Orders", context, { requestId: context.requestId, status: "received", ...(recurringItems.length ? { recurringItems } : {}) }) as Receipt;
  }
  async saveInquiry(_inquiry: Parameters<Repositories["saveInquiry"]>[0], context: WriteContext) {
    const config = _inquiry.configuration;
    return this.save("Inquiries", context, { requestId: context.requestId, status: "received",
      ...(config?.serviceType === "hoa-thoi" ? { configuration: config, recurrenceSnapshot: (config as import("@/domain/recurrence-snapshot").ConfigurationSnapshot).recurrenceSnapshot } : {}) }) as Receipt;
  }
  async saveComment(comment: Parameters<Repositories["saveComment"]>[0], context: WriteContext) {
    return this.save("Comments", context, { commentId: context.requestId, postId: comment.postId, displayName: comment.displayName, body: comment.body, createdAt: new Date().toISOString() }) as PublicComment;
  }
  async listComments(postId: string, cursor: string | null) {
    const rows = [...state().entries.values()].filter((entry) => !entry.hidden && "postId" in entry.data && entry.data.postId === postId).map((e) => e.data as PublicComment).sort((a,b) => b.createdAt.localeCompare(a.createdAt) || b.commentId.localeCompare(a.commentId));
    const index = cursor ? rows.findIndex((r) => r.commentId === cursor) : -1;
    if (cursor && index < 0) throw new DomainError(422, "INVALID_CURSOR", "Danh sách đã thay đổi. Vui lòng tải lại.");
    const comments = rows.slice(index + 1, index + 21);
    return { comments, nextCursor: rows.length > index + 21 ? comments.at(-1)!.commentId : null };
  }
}
export function resetMock() { globals.hoeMock = { entries: new Map(), rates: new Map() }; }
