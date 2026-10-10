import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { assertDbEnvironment, closeDb, getDb } from "@/server/db";
import * as s from "@/server/db/schema";
import { PostgresRepository } from "@/server/repositories/postgres";
import { structuralInquirySchema, structuralOrderSchema } from "@/domain/schemas";
import { serviceSchema } from "@/domain/content";
import { productRecord } from "@/server/db/mappers";
import { hashSubmission } from "@/server/integrations/signing";
import { adminList, adminSave } from "@/server/admin/repository";
import { revalidateTag } from "next/cache";
vi.mock("next/cache", () => ({ revalidateTag: vi.fn(), unstable_cache: (fn: unknown) => fn }));
const repo = new PostgresRepository(), actor = `hoa-thoi-test-${randomUUID()}`, productId = `thoi-itest-${randomUUID()}`;
const requests: string[] = [];
let originalService: typeof s.services.$inferSelect, product: ReturnType<typeof productRecord>;
function context(input: { requestId: string }) {
  requests.push(input.requestId);
  return { requestId: input.requestId, payloadHash: hashSubmission(input), rateKey: randomUUID() };
}
beforeAll(async () => {
  if (!process.env.DATABASE_URL || process.env.DB_ENV !== "test" || process.env.VERCEL_ENV || process.env.VERCEL) throw new Error("Requires the separate test DB and DB_ENV=test.");
  await assertDbEnvironment();
  const [service] = await getDb().select().from(s.services).where(eq(s.services.id, "hoa-thoi"));
  originalService = service;
  if (!service || !serviceSchema.parse(service.data).recurringRecommendations.length) throw new Error("Run guarded db:hoa-thoi migration against the test DB first.");
  const [row] = await getDb().insert(s.products).values({ id: productId, slug: productId, name: "Hoa Thời integration", description: "Kiểm thử lịch và giá quote", serviceType: "hoa-thoi", priceMode: "quote", publicationStatus: "published", fixture: 1, pricingRevision: "hoa-thoi-integration" }).returning();
  product = productRecord(row);
});
afterAll(async () => {
  if (process.env.DB_ENV === "test" && !process.env.VERCEL_ENV && originalService) {
    const db = getDb();
    const orders = await db.select({ id: s.orders.id }).from(s.orders).where(inArray(s.orders.requestId, requests));
    if (orders.length) await db.delete(s.orderItems).where(inArray(s.orderItems.orderId, orders.map((o) => o.id)));
    await db.delete(s.orders).where(inArray(s.orders.requestId, requests));
    await db.delete(s.inquiries).where(inArray(s.inquiries.requestId, requests));
    await db.delete(s.idempotencyRequests).where(inArray(s.idempotencyRequests.requestId, requests));
    await db.delete(s.rateLimitBuckets).where(inArray(s.rateLimitBuckets.identity, identities));
    await db.delete(s.products).where(eq(s.products.id, productId));
    await db.update(s.services).set({ data: originalService.data, editVersion: originalService.editVersion, updatedAt: originalService.updatedAt }).where(eq(s.services.id, "hoa-thoi"));
    await db.delete(s.adminAuditLogs).where(eq(s.adminAuditLogs.actorId, actor));
  }
  await closeDb();
});
const identities: string[] = [];
const inquiry = (recurrence: unknown) => structuralInquirySchema.parse({ requestId: randomUUID(), kind: "service", name: "Khách integration", phone: "0901234567", serviceType: "hoa-thoi", body: "", configuration: { serviceType: "hoa-thoi", recurrence } });
async function send(input: ReturnType<typeof inquiry>) {
  const ctx = context(input); identities.push(ctx.rateKey);
  return repo.submitInquiry(input, ctx, true);
}
describe("Hoa Thoi Postgres calendar snapshots and Admin", () => {
  const monthly = { version: 5, period: "month", bouquetsPerPeriod: 2, comboCount: 3, startPeriod: "2099-12", deliveryDates: ["2099-12-02", "2099-12-18", "2100-01-07", "2100-01-20", "2100-02-06", "2100-02-23"] };
  const weekly = { version: 5, period: "week", bouquetsPerPeriod: 1, comboCount: 2, startPeriod: "2099-12-14", deliveryDates: ["2099-12-15", "2099-12-24"] };
  it("stores exact dates, groups and totals in DB, receipt and Admin detail", async () => {
    const input = inquiry(monthly), receipt = await send(input);
    expect(receipt.recurrenceSnapshot).toMatchObject({ plannedTotalDeliveries: 6, totalBouquets: 6, endPeriod: "2100-02", recommendation: { id: "monthly-twice" } });
    const [row] = await getDb().select().from(s.inquiries).where(eq(s.inquiries.requestId, input.requestId));
    expect(row.configuration).toHaveProperty("recurrence.deliveryDates", monthly.deliveryDates);
    expect(row.configuration).toHaveProperty("recurrenceSnapshot.periodGroups", expect.arrayContaining([expect.objectContaining({ key: "2099-12", dates: monthly.deliveryDates.slice(0, 2) })]));
    const [detail] = await adminList("inquiries", row.id);
    expect((detail as typeof s.inquiries.$inferSelect).configuration).toEqual(row.configuration);
    expect(await repo.submitInquiry(input, context(input), false)).toEqual(receipt);
  });
  it("stores different weekday choices in consecutive weeks with an empty message", async () => {
    const input = inquiry(weekly), receipt = await send(input);
    expect(receipt.recurrenceSnapshot).toMatchObject({ totalBouquets: 2, endPeriod: "2099-12-21", recommendation: { id: "weekly-once" } });
    const [row] = await getDb().select().from(s.inquiries).where(eq(s.inquiries.requestId, input.requestId));
    expect(row.body).toBe("");
    expect(row.configuration).toHaveProperty("recurrence.deliveryDates", weekly.deliveryDates);
  });
  it("rejects legacy templates for new writes without deleting stored readers", async () => {
    await expect(send(inquiry({ version: 4, period: "week", weekdays: [1], durationWeeks: 2 }))).rejects.toMatchObject({ issues: expect.arrayContaining([expect.objectContaining({ message: "Vui lòng chọn lại gói và các ngày nhận theo calendar." })]) });
  });
  it("Admin changes do not mutate historical snapshots, and disabled suggestions allow custom quotes", async () => {
    const service = serviceSchema.parse(originalService.data), input = inquiry(monthly), receipt = await send(input);
    const edited = { ...service, recurringRecommendations: service.recurringRecommendations.map((r) => ({ ...r, enabled: false, suggestedPrice: { ...r.suggestedPrice, min: 1 } })) };
    await adminSave("services", "hoa-thoi", originalService.editVersion, edited, actor);
    expect(revalidateTag).toHaveBeenCalledWith("services", { expire: 0 });
    await expect(adminSave("services", "hoa-thoi", originalService.editVersion, service, actor)).rejects.toMatchObject({ status: 409 });
    const [current] = await getDb().select().from(s.services).where(eq(s.services.id, "hoa-thoi"));
    expect(current.data).toMatchObject({ image: service.image, subtitle: service.subtitle, hints: service.hints });
    const newReceipt = await send(inquiry(monthly));
    expect(newReceipt.recurrenceSnapshot?.recommendation).toBeNull();
    expect(receipt.recurrenceSnapshot?.recommendation?.suggestedPrice.min).toBe(950000);
    expect(await repo.submitInquiry(input, context(input), false)).toEqual(receipt);
    const [old] = await getDb().select().from(s.inquiries).where(eq(s.inquiries.requestId, input.requestId));
    expect(old.configuration).toHaveProperty("recurrenceSnapshot.recommendation.suggestedPrice.min", 950000);
    await getDb().update(s.services).set({ data: originalService.data, editVersion: originalService.editVersion }).where(eq(s.services.id, "hoa-thoi"));
  });
  it("order snapshot retains all dates while quantity and informational prices stay separate", async () => {
    const input = structuralOrderSchema.parse({ requestId: randomUUID(), buyer: { name: "Test", phone: "0901234567" }, recipient: { name: "Test" }, address: "Địa chỉ test", items: [{ lineId: randomUUID(), productId, expectedRevision: product.revision, quantity: 2, configuration: { serviceType: "hoa-thoi", recurrence: monthly } }] });
    const ctx = context(input); identities.push(ctx.rateKey);
    const receipt = await repo.submitOrder(input, ctx, true);
    const [order] = await getDb().select().from(s.orders).where(eq(s.orders.requestId, input.requestId));
    expect(order.totals).toMatchObject({ min: 0, max: 0, quoteCount: 1 });
    const [line] = await getDb().select().from(s.orderItems).where(eq(s.orderItems.orderId, order.id));
    expect(line.snapshot).toMatchObject({ quantity: 2, price: { mode: "quote" }, configuration: { recurrence: { deliveryDates: monthly.deliveryDates }, recurrenceSnapshot: { plannedTotalDeliveries: 6, recommendation: { id: "monthly-twice" } } } });
    expect(receipt.recurringItems?.[0].configuration).toHaveProperty("recurrence.deliveryDates", monthly.deliveryDates);
  });
});
