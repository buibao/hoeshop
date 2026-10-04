import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { randomUUID, createHash } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { getDb, closeDb, assertDbEnvironment } from "@/server/db";
import * as s from "@/server/db/schema";
import { PostgresRepository } from "@/server/repositories/postgres";
import { productRecord, pricingRevision } from "@/server/db/mappers";
import {
  productSchema,
  structuralOrderSchema,
  structuralInquirySchema,
  commentSchema,
  type OrderInput,
} from "@/domain/schemas";
import { canonical } from "@/domain/cart";
import { adminSave, adminList } from "@/server/admin/repository";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));
const run = randomUUID(),
  productId = "itest-" + run,
  postId = "post-" + run,
  requests: string[] = [];
const repo = new PostgresRepository();
function context(input: { requestId: string }, identity: string = run) {
  const { requestId, ...payload } = input;
  if (!requests.includes(requestId)) requests.push(requestId);
  return {
    requestId,
    payloadHash: createHash("sha256").update(canonical(payload)).digest("hex"),
    rateKey: createHash("sha256").update(identity).digest("hex"),
  };
}
let order: OrderInput;
beforeAll(async () => {
  if (
    !process.env.DATABASE_URL ||
    process.env.DB_ENV !== "test" ||
    process.env.VERCEL_ENV
  )
    throw new Error(
      "Integration requires a separate Postgres test DB and DB_ENV=test.",
    );
  process.env.CONTENT_MODE = "test";
  await assertDbEnvironment();
  const p = productSchema.parse({
    id: productId,
    slug: productId,
    name: "Hoa integration",
    description: "Dữ liệu kiểm thử riêng",
    serviceType: "hoa-tam",
    image: null,
    imageAlt: "",
    fixture: true,
    published: true,
    price: { mode: "fixed", amount: 200000, unit: "bó" },
  });
  const [row] = await getDb()
    .insert(s.products)
    .values({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      serviceType: p.serviceType,
      priceMode: "fixed",
      amount: 200000,
      unit: "bó",
      fixture: 1,
      publicationStatus: "published",
      pricingRevision: pricingRevision(p),
    })
    .returning();
  await getDb()
    .insert(s.posts)
    .values({
      id: postId,
      slug: postId,
      title: "Bài test",
      bodyMarkdown: "Test",
      publicationStatus: "published",
      fixture: 1,
    });
  order = structuralOrderSchema.parse({
    requestId: randomUUID(),
    buyer: { name: "Khách test", phone: "0901234567" },
    recipient: { name: "Người test" },
    address: "Địa chỉ test",
    items: [
      {
        lineId: randomUUID(),
        productId,
        expectedRevision: productRecord(row).revision,
        quantity: 2,
        configuration: {
          serviceType: "hoa-tam",
          emotion: "Thương",
          desiredDate: "2099-01-01",
        },
      },
    ],
  });
});
afterAll(async () => {
  if (requests.length && process.env.DB_ENV === "test")
    await getDb().transaction(async (tx) => {
      const own = await tx
        .select({ id: s.orders.id })
        .from(s.orders)
        .where(inArray(s.orders.requestId, requests));
      if (own.length)
        await tx.delete(s.orderItems).where(
          inArray(
            s.orderItems.orderId,
            own.map((r) => r.id),
          ),
        );
      await tx.delete(s.orders).where(inArray(s.orders.requestId, requests));
      await tx
        .delete(s.inquiries)
        .where(inArray(s.inquiries.requestId, requests));
      await tx
        .delete(s.idempotencyRequests)
        .where(inArray(s.idempotencyRequests.requestId, requests));
      await tx.delete(s.comments).where(eq(s.comments.postId, postId));
      await tx.delete(s.posts).where(eq(s.posts.id, postId));
      await tx.delete(s.products).where(eq(s.products.id, productId));
    });
  await closeDb();
});
describe("real Postgres transactions", () => {
  it("seed does not overwrite content already edited by admin", async () => {
    const [row] = await getDb()
      .select()
      .from(s.products)
      .where(eq(s.products.id, "test-tam-diu-dang"));
    if (!row) throw new Error("Seed fixtures before integration.");
    try {
      await getDb()
        .update(s.products)
        .set({
          name: "Admin đã sửa – giữ nguyên",
          editVersion: row.editVersion + 1,
        })
        .where(eq(s.products.id, row.id));
      await promisify(execFile)(
        process.execPath,
        ["node_modules/tsx/dist/cli.mjs", "scripts/db/seed.ts", "--fixtures"],
        { cwd: process.cwd(), env: process.env },
      );
      const [after] = await getDb()
        .select()
        .from(s.products)
        .where(eq(s.products.id, row.id));
      expect(after.name).toBe("Admin đã sửa – giữ nguyên");
      expect(after.editVersion).toBe(row.editVersion + 1);
    } finally {
      await getDb()
        .update(s.products)
        .set({ name: row.name, editVersion: row.editVersion })
        .where(eq(s.products.id, row.id));
    }
  });
  it("concurrent same ID commits exactly one order and one item snapshot", async () => {
    const ctx = context(order);
    const receipts = await Promise.all(
      Array.from({ length: 12 }, () => repo.submitOrder(order, ctx, true)),
    );
    expect(receipts.every((r) => r.requestId === order.requestId)).toBe(true);
    const rows = await getDb()
      .select()
      .from(s.orders)
      .where(eq(s.orders.requestId, order.requestId));
    expect(rows).toHaveLength(1);
    const items = await getDb()
      .select()
      .from(s.orderItems)
      .where(eq(s.orderItems.orderId, rows[0].id));
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });
  it("same ID with changed payload returns conflict", async () => {
    const changed = { ...order, notes: "Nội dung đổi" };
    await expect(
      repo.submitOrder(changed, context(changed), true),
    ).rejects.toMatchObject({ status: 409 });
  });
  it("lost response/restart and past date/catalog archive/shop close replay receipt", async () => {
    await getDb()
      .update(s.products)
      .set({ publicationStatus: "archived" })
      .where(eq(s.products.id, productId));
    await closeDb();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2099-01-02T00:00:00Z"));
    try {
      expect(
        await new PostgresRepository().submitOrder(
          order,
          context(order),
          false,
        ),
      ).toEqual({ requestId: order.requestId, status: "received" });
    } finally {
      vi.useRealTimers();
    }
    await getDb()
      .update(s.products)
      .set({ publicationStatus: "published" })
      .where(eq(s.products.id, productId));
  });
  it("rolls back an order and its rate bucket on item insert failure", async () => {
    const input = { ...order, requestId: randomUUID() },
      ctx = context(input, "rollback-" + run);
    // Inject an actual database failure after the order row was inserted, inside the same transaction.
    const trigger = "itest_fail_" + run.replaceAll("-", "");
    await getDb().execute(
      sql`CREATE FUNCTION ${sql.identifier(trigger)}() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN IF NEW.product_id = ''${sql.raw(productId)}'' THEN RAISE EXCEPTION ''integration rollback''; END IF; RETURN NEW; END'`,
    );
    await getDb().execute(
      sql`CREATE TRIGGER ${sql.identifier(trigger)} BEFORE INSERT ON order_items FOR EACH ROW EXECUTE FUNCTION ${sql.identifier(trigger)}()`,
    );
    try {
      await expect(repo.submitOrder(input, ctx, true)).rejects.toThrow();
      expect(
        await getDb()
          .select()
          .from(s.orders)
          .where(eq(s.orders.requestId, input.requestId)),
      ).toHaveLength(0);
      expect(
        await getDb()
          .select()
          .from(s.idempotencyRequests)
          .where(eq(s.idempotencyRequests.requestId, input.requestId)),
      ).toHaveLength(0);
      expect(
        await getDb()
          .select()
          .from(s.rateLimitBuckets)
          .where(eq(s.rateLimitBuckets.identity, ctx.rateKey)),
      ).toHaveLength(0);
    } finally {
      await getDb().execute(
        sql`DROP TRIGGER ${sql.identifier(trigger)} ON order_items`,
      );
      await getDb().execute(sql`DROP FUNCTION ${sql.identifier(trigger)}()`);
    }
  });
  it("shares rate limit across repository instances and does not charge committed retries", async () => {
    const identity = "rate-" + run;
    const inputs = Array.from({ length: 6 }, () => ({
      ...order,
      requestId: randomUUID(),
    }));
    const results = await Promise.allSettled(
      inputs.map((input) =>
        new PostgresRepository().submitOrder(
          input,
          context(input, identity),
          true,
        ),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(5);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
    const winner = inputs[results.findIndex((r) => r.status === "fulfilled")];
    expect(
      (await repo.submitOrder(winner, context(winner, identity), true)).status,
    ).toBe("received");
  });
  it("writes inquiries as text and keeps retry receipt", async () => {
    const input = structuralInquirySchema.parse({
      requestId: randomUUID(),
      name: '=HYPERLINK("x")',
      phone: "0901234567",
      serviceType: "tu-van",
      body: "+SUM(1,2)",
    });
    const ctx = context(input, "inq-" + run);
    await repo.submitInquiry(input, ctx, true);
    const [row] = await getDb()
      .select()
      .from(s.inquiries)
      .where(eq(s.inquiries.requestId, input.requestId));
    expect(row.body).toBe("+SUM(1,2)");
    expect((await repo.submitInquiry(input, ctx, false)).status).toBe(
      "received",
    );
  });
  it("pages comments, reflects hide immediately, and refuses to make hidden retry public", async () => {
    const inputs = Array.from({ length: 22 }, (_, n) =>
      commentSchema.parse({
        requestId: randomUUID(),
        postId,
        displayName: "Khách test",
        body: "Bình luận " + n,
      }),
    );
    for (let n = 0; n < inputs.length; n++)
      await repo.saveComment(
        inputs[n],
        context(inputs[n], "comment-" + run + n),
      );
    const page = await repo.listComments(postId, null);
    expect(page.comments).toHaveLength(20);
    expect(page.nextCursor).toBeTruthy();
    const next = await repo.listComments(postId, page.nextCursor);
    expect(next.comments).toHaveLength(2);
    expect(
      next.comments.some((c) =>
        page.comments.find((p) => p.commentId === c.commentId),
      ),
    ).toBe(false);
    const target = inputs[0];
    await adminSave(
      "comments",
      target.requestId,
      1,
      { visibility: "hidden" },
      "user_test",
    );
    await expect(
      repo.saveComment(target, context(target)),
    ).rejects.toMatchObject({ status: 409 });
    await adminSave(
      "comments",
      target.requestId,
      2,
      { visibility: "visible" },
      "user_test",
    );
    expect((await repo.saveComment(target, context(target))).commentId).toBe(
      target.requestId,
    );
  });
  it("rejects stale edits and keeps pricing revision stable for editorial updates", async () => {
    const [row] = await adminList("products", productId),
      p = productRecord(row as typeof s.products.$inferSelect);
    const input = {
      product: { ...p, revision: undefined, name: "Tên đã sửa" },
      publicationStatus: "published",
      sortOrder: 0,
    };
    delete (input.product as Record<string, unknown>).revision;
    await adminSave("products", productId, 1, input, "user_test");
    const [updated] = await getDb()
      .select()
      .from(s.products)
      .where(eq(s.products.id, productId));
    expect(updated.pricingRevision).toBe(p.revision);
    await expect(
      adminSave("products", productId, 1, input, "user_test"),
    ).rejects.toMatchObject({ status: 409 });
  });
});
