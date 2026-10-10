import { describe, expect, it, vi, afterEach } from "vitest";
import { randomUUID } from "node:crypto";
import { monthWeeks, addMonths, deriveRecurrence, recurrenceV4Schema, storedRecurrenceSchema, submissionRecurrenceSchema, initialRecommendations, matchRecommendation, recurrenceSnapshot, vietnamToday, recommendationPrice, parseVndAmount } from "@/domain/recurrence";
import { configurationSchema, storedConfigurationSchema, structuralInquirySchema, inquirySchema, productSchema } from "@/domain/schemas";
import { serviceSchema } from "@/domain/content";
import { cartKey, readCart, serializeCart, canonical } from "@/domain/cart";
import { effectivePrice, snapshotItems, summarize } from "@/domain/pricing";
import { hoaThoiMigration } from "@/domain/hoa-thoi-migration";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RecurrenceSummary } from "@/features/checkout/RecurrenceSummary";

const weekly = { version: 4 as const, period: "week" as const, weekdays: [1, 5], durationWeeks: 3 };
const monthly = { version: 4 as const, period: "month" as const, month: "2026-12", durationMonths: 3, weeks: [{ weekIndex: 2, weekdays: [2] }, { weekIndex: 4, weekdays: [5] }] };
afterEach(() => vi.useRealTimers());
describe("Hoa Thoi calendar and combos", () => {
  it("uses every Monday–Sunday calendar intersection, including six weeks", () => {
    const weeks = monthWeeks("2026-11");
    expect(weeks).toHaveLength(6);
    expect(weeks[0].days.filter((d) => d.date)).toEqual([{ weekday: 7, date: "2026-11-01" }]);
    expect(weeks[5].days.filter((d) => d.date)).toEqual([{ weekday: 1, date: "2026-11-30" }]);
    expect(monthWeeks("2027-02")).toHaveLength(4);
    expect(monthWeeks("2028-02").flatMap((w) => w.days.filter((d) => d.date))).toHaveLength(29);
    expect(monthWeeks("2026-00")).toEqual([]);
    expect(monthWeeks("2026-13")).toEqual([]);
  });
  it("repeats weekIndex and weekday across year boundaries, never day-of-month", () => {
    const result = deriveRecurrence(monthly);
    expect(result.plannedTotalDeliveries).toBe(6);
    expect(result.monthEnd).toBe("2027-02");
    expect(result.months.map((m) => m.slots.map((s) => s.date))).toEqual([
      ["2026-12-08", "2026-12-25"], ["2027-01-05", "2027-01-22"], ["2027-02-09", "2027-02-26"],
    ]);
    expect(addMonths("2026-12", 0)).toBe("2026-12");
    expect(addMonths("2026-12", 2)).toBe("2027-02");
  });
  it("keeps unavailable repeated slots and expected total", () => {
    const r = recurrenceV4Schema.parse({ ...monthly, month: "2026-11", durationMonths: 3, weeks: [{ weekIndex: 6, weekdays: [1] }] });
    const result = deriveRecurrence(r);
    expect(result.plannedTotalDeliveries).toBe(3);
    expect(result.resolvedCount).toBe(1);
    expect(result.unresolvedCount).toBe(2);
    expect(result.months[1].slots[0]).toEqual({ weekIndex: 6, weekday: 1, date: null });
  });
  it("weekly total is selected weekdays times continuous weeks without a default start", () => {
    expect(deriveRecurrence(weekly)).toMatchObject({ derivedCount: 2, plannedTotalDeliveries: 6, months: [] });
    expect(deriveRecurrence({ ...weekly, durationWeeks: 4 }).plannedTotalDeliveries).toBe(8);
    expect(deriveRecurrence({ ...weekly, weekdays: [1] }).plannedTotalDeliveries).toBe(3);
  });
  it.each(["", 0, -1, 1.5, 53, "3", null, Infinity])("rejects invalid weekly duration %s", (durationWeeks) => {
    expect(recurrenceV4Schema.safeParse({ ...weekly, durationWeeks }).success).toBe(false);
  });
  it.each(["", 0, -1, 1.5, 13, "3", null, Infinity])("rejects invalid monthly duration %s", (durationMonths) => {
    expect(recurrenceV4Schema.safeParse({ ...monthly, durationMonths }).success).toBe(false);
  });
  it("rejects duplicates, nonexistent slots, variants and client-owned counts/prices", () => {
    for (const bad of [
      { ...weekly, weekdays: [] }, { ...weekly, weekdays: [0] }, { ...weekly, weekdays: [8] }, { ...weekly, weekdays: [1.5] }, { ...weekly, weekdays: [1, 1] },
      { ...weekly, weeks: [] }, { ...weekly, durationMonths: 1 }, { ...weekly, timesPerPeriod: 2 }, { ...weekly, plannedTotalDeliveries: 6 },
      { ...monthly, durationWeeks: 3 }, { ...monthly, month: "2026-13" }, { ...monthly, weeks: [{ weekIndex: 6, weekdays: [1] }] },
      { ...monthly, weeks: [{ weekIndex: 1, weekdays: [1] }] }, { ...monthly, weeks: [monthly.weeks[0], monthly.weeks[0]] },
    ]) expect(recurrenceV4Schema.safeParse(bad).success).toBe(false);
    const invalid = storedRecurrenceSchema.safeParse({ ...monthly, weeks: [{ weekIndex: 2, weekdays: [] }] });
    expect(invalid.success).toBe(false);
    if (!invalid.success) expect(invalid.error.issues[0].path).toEqual(["weeks", 0, "weekdays"]);
  });
  it("validates current Vietnam day again on new writes, while reads preserve expired history", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-10T16:59:59Z"));
    expect(vietnamToday()).toBe("2026-10-10");
    const r = { version: 5, period: "week", bouquetsPerPeriod: 1, comboCount: 1, startPeriod: "2026-10-05", deliveryDates: ["2026-10-10"] };
    expect(submissionRecurrenceSchema.safeParse(r).success).toBe(true);
    vi.setSystemTime(new Date("2026-10-10T17:00:00Z"));
    expect(vietnamToday()).toBe("2026-10-11");
    expect(submissionRecurrenceSchema.safeParse(r).success).toBe(false);
    expect(storedRecurrenceSchema.safeParse(r).success).toBe(true);
    expect(submissionRecurrenceSchema.safeParse({ ...monthly, month: "2026-09" }).success).toBe(false);
    expect(submissionRecurrenceSchema.safeParse({ ...monthly, month: "2026-10", weeks: [{ weekIndex: 1, weekdays: [4] }] }).success).toBe(false);
  });
});
describe("Hoa Thoi content, identity and compatibility", () => {
  it("presents legacy schedules without inventing a duration or current historical price", () => {
    const view = (recurrence: unknown) => renderToStaticMarkup(createElement(RecurrenceSummary, { recurrence }));
    const oldWeek = view({ version: 2, period: "week", weekdays: [1, 5] });
    expect(oldWeek).toContain("Chưa ghi nhận số tuần liên tục");
    expect(oldWeek).toContain("Thứ Hai, Thứ Sáu");
    expect(oldWeek).not.toContain("Tổng:");
    const oldMonth = view({ version: 3, period: "month", month: "2026-12", weeks: monthly.weeks });
    expect(oldMonth).toContain("Chưa ghi nhận số tháng liên tục");
    expect(oldMonth).toContain("08/12/2026");
    expect(view({ version: 3, period: "week", weekdays: [1, 5], durationWeeks: 3 })).toContain("6 lần nhận dự kiến");
    expect(view(weekly)).toContain("Hòe sẽ tư vấn giá phù hợp");
    expect(view(weekly)).not.toContain("1.800.000");
  });
  it("reads Vietnamese thousands as whole VND, never decimal rounding", () => {
    expect(parseVndAmount("950.000")).toBe(950000);
    expect(parseVndAmount("1.300.000")).toBe(1300000);
    expect(parseVndAmount("950000")).toBe(950000);
    for (const bad of ["", "-1", "950,5", "1.2", "9.", "1e6"]) expect(parseVndAmount(bad)).toBeNull();
  });
  it("matches per-period counts, keeps price bases, never multiplies combo prices", () => {
    expect(matchRecommendation(monthly, initialRecommendations)?.id).toBe("monthly-twice");
    expect(matchRecommendation(weekly, initialRecommendations)).toBeUndefined();
    expect(matchRecommendation({ ...weekly, weekdays: [1] }, initialRecommendations)?.id).toBe("weekly-once");
    expect(recommendationPrice(initialRecommendations[0])).toBe("500.000–700.000 ₫/lần");
    expect(recommendationPrice(initialRecommendations[2])).toBe("1.800.000–2.400.000 ₫/tháng");
    const snapshot = recurrenceSnapshot(monthly, initialRecommendations);
    const edited = structuredClone(initialRecommendations); edited[1].suggestedPrice.min = 1; edited[1].enabled = false;
    expect(snapshot.recommendation?.suggestedPrice.min).toBe(950000);
    expect(recurrenceSnapshot(monthly, edited).recommendation).toBeNull();
  });
  it("preserves legacy recurrence and requires explicit v4 choices on new submissions", () => {
    for (const recurrence of [undefined, { period: "week", timesPerPeriod: 2 }, { version: 1, period: "week", timesPerPeriod: 2 }, { version: 2, period: "week", weekdays: [1, 5] }, { version: 2, period: "month", month: "2026-12", weeks: monthly.weeks }, { version: 3, period: "month", month: "2026-12", weeks: monthly.weeks }, { version: 3, period: "week", weekdays: [1, 5], durationWeeks: 3 }]) {
      const c = { serviceType: "hoa-thoi", ...(recurrence ? { recurrence } : {}) };
      const saved = storedConfigurationSchema.parse(c);
      expect(configurationSchema.safeParse(c).success).toBe(false);
      if (saved.serviceType === "hoa-thoi") expect(saved.recurrence).toEqual(recurrence);
    }
  });
  it("cart keys include schedules and durations, canonicalize order, and survive reload", () => {
    const make = (recurrence: unknown) => ({ lineId: randomUUID(), productId: "test-thoi", expectedRevision: "r", quantity: 1, configuration: storedConfigurationSchema.parse({ serviceType: "hoa-thoi", recurrence }) });
    const a = make(weekly), b = make({ ...weekly, weekdays: [5, 1] });
    expect(cartKey(a)).toBe(cartKey(b));
    expect(canonical(weekly)).toBe(canonical({ ...weekly, weekdays: [5, 1] }));
    expect(cartKey(a)).not.toBe(cartKey(make({ ...weekly, weekdays: [2, 5] })));
    expect(cartKey(a)).not.toBe(cartKey(make({ ...weekly, durationWeeks: 1 })));
    expect(cartKey(make(monthly))).not.toBe(cartKey(make({ ...monthly, durationMonths: 1 })));
    expect(cartKey(make(monthly))).toBe(cartKey(make({ ...monthly, weeks: [...monthly.weeks].reverse() })));
    const m = make(monthly);
    expect(readCart(serializeCart([a, m]))).toEqual([a, m]);
  });
  it("allows empty service Hoa Thoi messages only with a valid schedule", () => {
    const base = { requestId: randomUUID(), name: "Test", phone: "0901234567", kind: "service", serviceType: "hoa-thoi", body: " ", configuration: { serviceType: "hoa-thoi", recurrence: { version: 5, period: "week", bouquetsPerPeriod: 1, comboCount: 1, startPeriod: "2099-12-14", deliveryDates: ["2099-12-15"] } } };
    expect(inquirySchema.safeParse(base).success).toBe(true);
    expect(inquirySchema.safeParse({ ...base, kind: "general", configuration: undefined }).success).toBe(false);
    expect(inquirySchema.safeParse({ ...base, configuration: { serviceType: "hoa-thoi" } }).success).toBe(false);
    expect(structuralInquirySchema.safeParse({ ...base, body: "Old", configuration: { serviceType: "hoa-thoi" } }).success).toBe(true);
  });
  it("content defaults empty, validates uniqueness and price ranges, restricts service", () => {
    const base = { id: "hoa-thoi", name: "Test", shortName: "Thời", number: "01", subtitle: "Test", description: "Test", image: null };
    expect(serviceSchema.parse(base).recurringRecommendations).toEqual([]);
    expect(serviceSchema.safeParse({ ...base, recurringRecommendations: initialRecommendations }).success).toBe(true);
    for (const rows of [[initialRecommendations[0], initialRecommendations[0]], [...initialRecommendations, { ...initialRecommendations[1], id: "extra" }], [{ ...initialRecommendations[0], suggestedPrice: { min: 10, max: 1, basis: "month" } }], [{ ...initialRecommendations[2], timesPerPeriod: 8 }]]) expect(serviceSchema.safeParse({ ...base, recurringRecommendations: rows }).success).toBe(false);
    expect(serviceSchema.safeParse({ ...base, id: "hoa-tam", recurringRecommendations: initialRecommendations }).success).toBe(false);
    expect(hoaThoiMigration({ ...base, recurringRecommendations: [] })).toEqual({});
    expect(hoaThoiMigration(base)).toEqual({ recurringRecommendations: initialRecommendations });
  });
  it("keeps Hoa Thoi quote totals while server snapshot retains desired combo", () => {
    const product = { ...productSchema.parse({ id: "test", slug: "test", name: "Test", serviceType: "hoa-thoi", description: "Test", image: null, imageAlt: "", price: { mode: "quote" }, published: true }), revision: "r" };
    const c = storedConfigurationSchema.parse({ serviceType: "hoa-thoi", recurrence: { version: 5, period: "month", bouquetsPerPeriod: 2, comboCount: 3, startPeriod: "2099-12", deliveryDates: ["2099-12-01", "2099-12-15", "2100-01-01", "2100-01-15", "2100-02-01", "2100-02-15"] } });
    expect(effectivePrice(product, c)).toEqual({ mode: "quote" });
    const lines = snapshotItems([{ lineId: randomUUID(), productId: "test", expectedRevision: "r", quantity: 2, configuration: c }], [product], initialRecommendations);
    expect(lines[0].configuration).toHaveProperty("recurrenceSnapshot.plannedTotalDeliveries", 6);
    expect(summarize(lines)).toMatchObject({ min: 0, max: 0, quoteCount: 1 });
  });
});
