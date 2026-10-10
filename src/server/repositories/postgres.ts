import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb, assertDbEnvironment } from "@/server/db";
import * as s from "@/server/db/schema";
import { productRecord } from "@/server/db/mappers";
import {
  orderSchema,
  inquirySchema,
  DomainError,
  type OrderInput,
  type InquiryInput,
  type CommentInput,
  type PublicComment,
  type Receipt,
} from "@/domain/schemas";
import { snapshotItems, summarize } from "@/domain/pricing";
import { snapshotConfiguration } from "@/domain/recurrence-snapshot";
import { serviceSchema } from "@/domain/content";
import type { WriteContext } from "./contracts";
type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
type Operation = "orders" | "inquiries" | "comments";
const conflict = () =>
  new DomainError(
    409,
    "REQUEST_CONFLICT",
    "Mã yêu cầu đã được dùng cho nội dung khác.",
  );
async function existing(
  tx: Tx | ReturnType<typeof getDb>,
  operation: Operation,
  ctx: WriteContext,
) {
  const [row] = await tx
    .select()
    .from(s.idempotencyRequests)
    .where(
      and(
        eq(s.idempotencyRequests.operation, operation),
        eq(s.idempotencyRequests.requestId, ctx.requestId),
      ),
    );
  if (row && row.payloadHash !== ctx.payloadHash) throw conflict();
  return row;
}
async function rate(tx: Tx, operation: Operation, identity: string) {
  const window = operation === "comments" ? 60000 : 600000,
    now = Date.now(),
    start = new Date(Math.floor(now / window) * window);
  await tx
    .delete(s.rateLimitBuckets)
    .where(sql`${s.rateLimitBuckets.expiresAt}<now()`);
  const [bucket] = await tx
    .insert(s.rateLimitBuckets)
    .values({
      operation,
      identity,
      windowStart: start,
      count: 1,
      expiresAt: new Date(start.valueOf() + window),
    })
    .onConflictDoUpdate({
      target: [
        s.rateLimitBuckets.operation,
        s.rateLimitBuckets.identity,
        s.rateLimitBuckets.windowStart,
      ],
      set: { count: sql`${s.rateLimitBuckets.count}+1` },
    })
    .returning();
  if (bucket.count > 5)
    throw new DomainError(
      429,
      "RATE_LIMITED",
      "Bạn đã gửi nhiều yêu cầu. Vui lòng chờ rồi thử lại.",
    );
}
function publicComment(row: typeof s.comments.$inferSelect): PublicComment {
  return {
    commentId: row.id,
    postId: row.postId,
    displayName: row.displayName,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}
export function encodeCursor(row: PublicComment) {
  return Buffer.from(JSON.stringify([row.createdAt, row.commentId])).toString(
    "base64url",
  );
}
export function decodeCursor(cursor: string) {
  try {
    const value = JSON.parse(Buffer.from(cursor, "base64url").toString());
    if (
      !Array.isArray(value) ||
      value.length !== 2 ||
      typeof value[0] !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T/.test(value[0]) ||
      !Number.isFinite(new Date(value[0]).valueOf()) ||
      typeof value[1] !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value[1],
      )
    )
      throw new Error();
    return { createdAt: new Date(value[0]), id: value[1] };
  } catch {
    throw new DomainError(
      422,
      "INVALID_CURSOR",
      "Vui lòng tải lại danh sách bình luận.",
    );
  }
}
export class PostgresRepository {
  private async write<T>(
    operation: Operation,
    ctx: WriteContext,
    create: (tx: Tx) => Promise<{ resourceId: string; receipt: T }>,
    replay?: (tx: Tx, receipt: T) => Promise<T>,
  ): Promise<T> {
    await assertDbEnvironment();
    return getDb().transaction(async (tx) => {
      // Serialize only the same operation/ID; unrelated requests remain concurrent.
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtextextended(${operation + ":" + ctx.requestId},0))`,
      );
      const old = await existing(tx, operation, ctx);
      if (old) {
        ctx.replayed = true;
        return replay ? replay(tx, old.receipt as T) : (old.receipt as T);
      }
      await rate(tx, operation, ctx.rateKey);
      const saved = await create(tx);
      await tx
        .insert(s.idempotencyRequests)
        .values({
          operation,
          requestId: ctx.requestId,
          payloadHash: ctx.payloadHash,
          resourceId: saved.resourceId,
          receipt: saved.receipt,
        });
      return saved.receipt;
    });
  }
  async submitOrder(
    input: OrderInput,
    ctx: WriteContext,
    open: boolean,
  ): Promise<Receipt> {
    return this.write("orders", ctx, async (tx) => {
      if (!open)
        throw new DomainError(
          503,
          "SHOP_NOT_OPEN",
          "Hòe đang chuẩn bị mở nhận yêu cầu đặt hoa.",
        );
      const validated = orderSchema.parse(input);
      const rows = await tx
        .select()
        .from(s.products)
        .where(
          and(
            inArray(
              s.products.id,
              validated.items.map((i) => i.productId),
            ),
            eq(s.products.publicationStatus, "published"),
            process.env.CONTENT_MODE !== "test"
              ? eq(s.products.fixture, 0)
              : undefined,
          ),
        )
        .orderBy(s.products.id)
        .for("share");
      const [service] = await tx.select().from(s.services).where(eq(s.services.id, "hoa-thoi")).for("share");
      const recommendations = service ? serviceSchema.parse(service.data).recurringRecommendations : [];
      const items = snapshotItems(validated.items, rows.map(productRecord), recommendations);
      if (JSON.stringify(items).length > 45000)
        throw new DomainError(
          422,
          "SNAPSHOT_TOO_LARGE",
          "Yêu cầu quá dài. Vui lòng chia thành các yêu cầu nhỏ hơn.",
        );
      const [order] = await tx
        .insert(s.orders)
        .values({
          requestId: ctx.requestId,
          buyer: validated.buyer,
          recipient: {
            ...validated.recipient,
            phone: validated.recipient.phone || validated.buyer.phone,
          },
          address: validated.address,
          notes: validated.notes,
          totals: summarize(items),
        })
        .returning({ id: s.orders.id });
      await tx
        .insert(s.orderItems)
        .values(
          items.map((item, position) => ({
            orderId: order.id,
            position,
            productId: validated.items[position].productId,
            quantity: item.quantity,
            snapshot: item,
          })),
        );
      return {
        resourceId: order.id,
        receipt: { requestId: ctx.requestId, status: "received" as const,
          ...(items.some((i) => i.configuration.serviceType === "hoa-thoi") ? { recurringItems: items.filter((i) => i.configuration.serviceType === "hoa-thoi").map((i) => ({ name: i.name, quantity: i.quantity, configuration: i.configuration })) } : {}) },
      };
    });
  }
  async submitInquiry(
    input: InquiryInput,
    ctx: WriteContext,
    open: boolean,
  ): Promise<Receipt> {
    return this.write("inquiries", ctx, async (tx) => {
      if (!open)
        throw new DomainError(
          503,
          "SHOP_NOT_OPEN",
          "Hòe đang chuẩn bị mở nhận yêu cầu tư vấn.",
        );
      const v = inquirySchema.parse(input);
      const [service] = v.configuration?.serviceType === "hoa-thoi"
        ? await tx.select().from(s.services).where(eq(s.services.id, "hoa-thoi")).for("share") : [];
      const configuration = v.configuration ? snapshotConfiguration(v.configuration, service ? serviceSchema.parse(service.data).recurringRecommendations : []) : undefined;
      const [row] = await tx
        .insert(s.inquiries)
        .values({
          requestId: ctx.requestId,
          kind: v.kind,
          serviceType: v.serviceType,
          contact: { name: v.name, phone: v.phone, email: v.email },
          body: v.body,
          configuration: configuration || null,
        })
        .returning({ id: s.inquiries.id });
      return {
        resourceId: row.id,
        receipt: { requestId: ctx.requestId, status: "received" as const,
          ...(configuration?.serviceType === "hoa-thoi" ? { configuration: v.configuration, recurrenceSnapshot: "recurrenceSnapshot" in configuration ? configuration.recurrenceSnapshot : undefined } : {}) },
      };
    });
  }
  async saveComment(
    input: CommentInput,
    ctx: WriteContext,
  ): Promise<PublicComment> {
    return this.write(
      "comments",
      ctx,
      async (tx) => {
        const [post] = await tx
          .select({ id: s.posts.id })
          .from(s.posts)
          .where(
            and(
              eq(s.posts.id, input.postId),
              eq(s.posts.publicationStatus, "published"),
            ),
          )
          .for("share");
        if (!post)
          throw new DomainError(
            422,
            "UNKNOWN_POST",
            "Bài viết không khả dụng.",
          );
        const [row] = await tx
          .insert(s.comments)
          .values({
            id: ctx.requestId,
            postId: input.postId,
            displayName: input.displayName,
            body: input.body,
          })
          .returning();
        return { resourceId: row.id, receipt: publicComment(row) };
      },
      async (tx, receipt) => {
        const [row] = await tx
          .select()
          .from(s.comments)
          .innerJoin(s.posts, eq(s.posts.id, s.comments.postId))
          .where(
            and(
              eq(s.comments.id, receipt.commentId),
              eq(s.comments.visibility, "visible"),
              eq(s.posts.publicationStatus, "published"),
            ),
          );
        if (!row)
          throw new DomainError(
            409,
            "COMMENT_HIDDEN",
            "Bình luận không còn công khai.",
          );
        return publicComment(row.comments);
      },
    );
  }
  async listComments(postId: string, cursor: string | null) {
    await assertDbEnvironment();
    const [post] = await getDb()
      .select({ id: s.posts.id })
      .from(s.posts)
      .where(
        and(eq(s.posts.id, postId), eq(s.posts.publicationStatus, "published")),
      );
    if (!post)
      throw new DomainError(422, "UNKNOWN_POST", "Bài viết không khả dụng.");
    const c = cursor ? decodeCursor(cursor) : null;
    const rows = await getDb()
      .select()
      .from(s.comments)
      .where(
        and(
          eq(s.comments.postId, postId),
          eq(s.comments.visibility, "visible"),
          c
            ? sql`(${s.comments.createdAt},${s.comments.id})<(${c.createdAt},${c.id}::uuid)`
            : undefined,
        ),
      )
      .orderBy(desc(s.comments.createdAt), desc(s.comments.id))
      .limit(21);
    const comments = rows.slice(0, 20).map(publicComment);
    return {
      comments,
      nextCursor: rows.length > 20 ? encodeCursor(comments.at(-1)!) : null,
    };
  }
}
