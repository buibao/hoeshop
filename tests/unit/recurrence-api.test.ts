import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { POST } from "@/app/api/inquiries/route";
import { resetMock, MockRepository } from "@/server/integrations/mock";
import { structuralInquirySchema } from "@/domain/schemas";
import { hashSubmission, rateKey } from "@/server/integrations/signing";
const request = (body: unknown) => new Request("http://localhost:3000/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json", "x-hoe-test-identity": randomUUID() }, body: JSON.stringify(body) });
const input = (recurrence: unknown) => ({ requestId: randomUUID(), kind: "service", name: "Khách test", phone: "0901234567", serviceType: "hoa-thoi", body: "", configuration: { serviceType: "hoa-thoi", recurrence } });
const week = { version: 5, period: "week", bouquetsPerPeriod: 2, comboCount: 2, startPeriod: "2026-10-12", deliveryDates: ["2026-10-14", "2026-10-17", "2026-10-20", "2026-10-23"] };
const month = { version: 5, period: "month", bouquetsPerPeriod: 2, comboCount: 2, startPeriod: "2026-10", deliveryDates: ["2026-10-15", "2026-10-28", "2026-11-05", "2026-11-22"] };
beforeEach(() => { vi.stubEnv("CONTENT_MODE", "test"); vi.stubEnv("DATA_ADAPTER", "mock"); vi.stubEnv("DATABASE_URL", ""); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-10T10:00:00Z")); resetMock(); });
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });
describe("calendar package API and preserved receipts", () => {
  it("accepts an empty message with exact per-week dates and derives authoritative groups", async () => {
    const response = await POST(request(input(week))); expect(response.status).toBe(201);
    const receipt = await response.json();
    expect(receipt.configuration.recurrence).toEqual(week);
    expect(receipt.recurrenceSnapshot).toMatchObject({ totalBouquets: 4, endPeriod: "2026-10-19", recommendation: null });
    expect(receipt.recurrenceSnapshot.periodGroups.map((g: { dates: string[] }) => g.dates.length)).toEqual([2, 2]);
  });
  it("snapshots matched monthly reference price without multiplying the combo", async () => {
    const response = await POST(request(input(month))); expect(response.status).toBe(201);
    expect((await response.json()).recurrenceSnapshot).toMatchObject({ totalBouquets: 4, timezone: "Asia/Ho_Chi_Minh", endPeriod: "2026-11", recommendation: { id: "monthly-twice", bouquetsPerPeriod: 2, suggestedPrice: { min: 950000, max: 1300000, basis: "month" } } });
  });
  it("replays the same receipt after midnight before current no-past validation", async () => {
    const body = input({ ...week, bouquetsPerPeriod: 1, comboCount: 1, startPeriod: "2026-10-05", deliveryDates: ["2026-10-10"] });
    const response = await POST(request(body)); const receipt = await response.json(); expect(response.status).toBe(201);
    vi.setSystemTime(new Date("2026-10-10T17:00:00Z"));
    const replay = await POST(request(body)); expect(replay.status).toBe(200); expect(await replay.json()).toEqual(receipt);
    expect((await POST(request({ ...body, requestId: randomUUID() }))).status).toBe(422);
    expect((await POST(request({ ...body, configuration: { serviceType: "hoa-thoi", recurrence: { ...week, bouquetsPerPeriod: 1, comboCount: 1, startPeriod: "2026-10-12", deliveryDates: ["2026-10-14"] } } }))).status).toBe(409);
  });
  it("replays processed legacy configurations while refusing new legacy submissions", async () => {
    for (const recurrence of [{ version: 2, period: "week", weekdays: [1, 5] }, { version: 5, period: "week", recommendationId: "weekly-once", timesPerPeriod: 1, weekdays: [1], durationWeeks: 1 }, { version: 6, period: "week", recommendationId: "weekly-once", timesPerPeriod: 1, weekdays: [1], durationWeeks: 1 }]) {
      const raw = { ...input(recurrence), body: "Yêu cầu đã xử lý" };
      const parsed = structuralInquirySchema.parse(raw), req = request(raw);
      await new MockRepository().saveInquiry({ ...parsed, status: "received", createdAt: "2020-01-01T00:00:00Z" }, { requestId: parsed.requestId, payloadHash: hashSubmission(parsed), rateKey: rateKey(req) });
      expect((await POST(req)).status).toBe(200);
      expect((await POST(request({ ...raw, requestId: randomUUID() }))).status).toBe(422);
    }
  });
  it("rejects duplicate, outside, forged, underfilled, overfilled and stale schedules", async () => {
    for (const recurrence of [undefined, { ...week, deliveryDates: [] }, { ...week, deliveryDates: ["2026-10-14", "2026-10-14", "2026-10-20", "2026-10-23"] }, { ...week, deliveryDates: ["2026-10-13", "2026-10-14", "2026-10-17", "2026-10-20"] }, { ...week, deliveryDates: ["2026-10-14", "2026-10-17", "2026-10-27", "2026-10-30"] }, { ...week, startPeriod: "2026-10-14" }, { ...week, plannedTotalDeliveries: 4 }, { ...week, weeks: [] }, { ...week, version: 6 }, { ...month, bouquetsPerPeriod: "2" }]) expect((await POST(request(input(recurrence)))).status).toBe(422);
    const body = input(month);
    expect((await POST(request({ ...body, configuration: { ...body.configuration, recurrenceSnapshot: {} } }))).status).toBe(422);
  });
});
