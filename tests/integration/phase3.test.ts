import { beforeAll, afterAll, it, expect, vi } from "vitest";
import { randomUUID, createHash } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { getDb, assertDbEnvironment, closeDb } from "@/server/db";
import * as s from "@/server/db/schema";
import { PUT } from "@/app/api/admin/[resource]/[id]/route";
import { getProductsFresh } from "@/server/content";
import { adminList } from "@/server/admin/repository";
import { structuralOrderSchema } from "@/domain/schemas";
import { defaultConfiguration, canonical } from "@/domain/cart";
import { PostgresRepository } from "@/server/repositories/postgres";
vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: "phase3_test_admin" }),
}));
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));
const id = "phase3-" + randomUUID(),
  requestIds: string[] = [],
  orderIds: string[] = [];
const context = { params: Promise.resolve({ resource: "products", id }) };
const product = {
  id,
  slug: id,
  name: "Hoa Ý regression",
  description: "Test riêng",
  serviceType: "hoa-y",
  image: null,
  imageAlt: "",
  published: false,
  fixture: true,
  price: { mode: "fixed", amount: 500000, unit: "mẫu" },
  defaultDesign: {},
  pricedOptions: {},
};
function save(
  editVersion: number,
  publicationStatus: string,
  design = {},
  options = {},
) {
  return PUT(
    new Request("http://localhost/api/admin/products/" + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        editVersion,
        data: {
          product: {
            ...product,
            defaultDesign: design,
            pricedOptions: options,
          },
          publicationStatus,
          sortOrder: 0,
        },
      }),
    }),
    context,
  );
}
beforeAll(async () => {
  if (process.env.DB_ENV !== "test" || process.env.VERCEL_ENV)
    throw new Error("Dedicated test Postgres required");
  await assertDbEnvironment();
  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_placeholder");
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_placeholder");
  vi.stubEnv("ADMIN_CLERK_USER_IDS", "phase3_test_admin");
  vi.stubEnv("CONTENT_MODE", "test");
});
afterAll(async () => {
  if (orderIds.length) {
    await getDb()
      .delete(s.orderItems)
      .where(inArray(s.orderItems.orderId, orderIds));
    await getDb().delete(s.orders).where(inArray(s.orders.id, orderIds));
  }
  if (requestIds.length)
    await getDb()
      .delete(s.idempotencyRequests)
      .where(inArray(s.idempotencyRequests.requestId, requestIds));
  await getDb().delete(s.products).where(eq(s.products.id, id));
  await getDb()
    .delete(s.adminAuditLogs)
    .where(eq(s.adminAuditLogs.resourceId, id));
  await closeDb();
  vi.unstubAllEnvs();
});
it("admin → published catalog → default/priced/custom shapes → atomic order snapshots", async () => {
  const invalid = await save(0, "published");
  expect(invalid.status).toBe(422);
  expect((await invalid.json()).error.fields).toContainEqual(
    expect.objectContaining({ path: "product.defaultDesign.shape" }),
  );
  expect((await save(0, "draft")).status).toBe(200);
  expect(
    (await save(1, "published", { shape: "binh" }, { shape: ["hop"] })).status,
  ).toBe(200);
  expect((await save(1, "published", { shape: "bo" })).status).toBe(409);
  const current = (await getProductsFresh()).find((p) => p.id === id)!;
  expect(defaultConfiguration(current).shape).toBe("binh");
  for (const shape of ["binh", "hop", "bo"]) {
    const requestId = randomUUID();
    requestIds.push(requestId);
    const input = structuralOrderSchema.parse({
      requestId,
      buyer: { name: "Khách test", phone: "0901234567" },
      recipient: { name: "Người test" },
      address: "Địa chỉ test",
      items: [
        {
          lineId: randomUUID(),
          productId: id,
          expectedRevision: current.revision,
          quantity: 2,
          configuration: { ...defaultConfiguration(current), shape },
        },
      ],
    });
    const { requestId: _id, ...payload } = input;
    void _id;
    const ctx = {
      requestId,
      payloadHash: createHash("sha256")
        .update(canonical(payload))
        .digest("hex"),
      rateKey: createHash("sha256").update(id).digest("hex"),
    };
    const receipt = await new PostgresRepository().submitOrder(
      input,
      ctx,
      true,
    );
    const [order] = await getDb()
      .select()
      .from(s.orders)
      .where(eq(s.orders.requestId, requestId));
    orderIds.push(order.id);
    const items = await getDb()
      .select()
      .from(s.orderItems)
      .where(eq(s.orderItems.orderId, order.id));
    expect(items).toHaveLength(1);
    expect(items[0].snapshot).toMatchObject({
      configuration: { shape },
      quantity: 2,
      price:
        shape === "bo" ? { mode: "quote" } : { mode: "fixed", amount: 500000 },
    });
    expect(order.totals).toMatchObject({
      pricedCount: shape === "bo" ? 0 : 1,
      quoteCount: shape === "bo" ? 1 : 0,
      min: shape === "bo" ? 0 : 1000000,
    });
    expect(
      await new PostgresRepository().submitOrder(input, ctx, false),
    ).toEqual(receipt);
    const listing = await adminList("orders");
    expect(
      listing.find((r) => (r as { id: string }).id === order.id),
    ).toMatchObject({ serviceTypes: ["hoa-y"] });
  }
});
