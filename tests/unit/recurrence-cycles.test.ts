import { describe, expect, it } from "vitest";
import { deriveRecurrence, recurrenceV5Schema, recurrenceV6Schema, recurrenceSnapshot, initialRecommendations, storedRecurrenceSchema } from "@/domain/recurrence";
import { configurationSchema } from "@/domain/schemas";
const monthly = { version: 5 as const, recommendationId: "monthly-twice", timesPerPeriod: 2, period: "month" as const, startDate: "2026-12-01", durationMonths: 3, weeks: [{ weekIndex: 2, weekdays: [2] }, { weekIndex: 4, weekdays: [5] }] };
describe("four-week package cycles", () => {
  it("records monthly weekdays as preferences and uses package frequency for totals", () => {
    const r = recurrenceV6Schema.parse({ version: 6, recommendationId: "monthly-twice", timesPerPeriod: 2, period: "month", weekdays: [2], durationMonths: 3 });
    expect(deriveRecurrence(r)).toMatchObject({ plannedTotalDeliveries: 6, derivedCount: 2, totalWeeks: 12, resolvedCount: 0, unresolvedCount: 6, cycles: [] });
    expect(recurrenceSnapshot(r, initialRecommendations).recommendation?.id).toBe("monthly-twice");
  });
  it("does not multiply weekday preferences into the package delivery count", () => {
    const r = recurrenceV6Schema.parse({ version: 6, recommendationId: "weekly-once", timesPerPeriod: 1, period: "week", weekdays: [5, 1], durationWeeks: 3 });
    expect(r.weekdays).toEqual([1, 5]);
    expect(deriveRecurrence(r).plannedTotalDeliveries).toBe(3);
  });
  it("requires weekdays and rejects start date, time and week slots in the new format", () => {
    const r = { version: 6, recommendationId: "monthly-once", timesPerPeriod: 1, period: "month", weekdays: [1], durationMonths: 1 };
    for (const changes of [{ weekdays: [] }, { weekdays: [1, 1] }, { startDate: "2026-12-01" }, { desiredTime: "10:00" }, { weeks: [{ weekIndex: 1, weekdays: [1] }] }]) expect(recurrenceV6Schema.safeParse({ ...r, ...changes }).success).toBe(false);
  });
  it("repeats monthly slots after 28 days through the year boundary", () => {
    const result = deriveRecurrence(recurrenceV5Schema.parse(monthly));
    expect(result).toMatchObject({ derivedCount: 2, plannedTotalDeliveries: 6, totalWeeks: 12, unresolvedCount: 0 });
    expect(result.cycles?.map((c) => c.startDate)).toEqual(["2026-12-01", "2026-12-29", "2027-01-26"]);
    expect(result.cycles?.map((c) => c.slots.map((s) => s.date))).toEqual([["2026-12-08", "2026-12-25"], ["2027-01-05", "2027-01-22"], ["2027-02-02", "2027-02-19"]]);
  });
  it("supports a cycle starting on any weekday without days outside the cycle", () => {
    const result = deriveRecurrence(recurrenceV5Schema.parse({ ...monthly, startDate: "2028-02-29", weeks: [{ weekIndex: 1, weekdays: [1] }, { weekIndex: 4, weekdays: [7] }] }));
    expect(result.cycles?.[0].slots.map((s) => s.date)).toEqual(["2028-03-06", "2028-03-26"]);
  });
  it("requires an exact frequency, a start date and four valid weeks", () => {
    for (const change of [{ timesPerPeriod: 1 }, { startDate: "" }, { weeks: [{ weekIndex: 5, weekdays: [1, 2] }] }, { durationMonths: 0 }, { durationMonths: 1.5 }]) expect(recurrenceV5Schema.safeParse({ ...monthly, ...change }).success).toBe(false);
    expect(recurrenceV5Schema.safeParse({ version: 5, period: "week", recommendationId: "weekly-once", timesPerPeriod: 1, weekdays: [1, 5], durationWeeks: 3 }).success).toBe(false);
  });
  it("reads historical template prices while requiring calendar choices on new writes", () => {
    expect(recurrenceSnapshot(recurrenceV5Schema.parse(monthly), initialRecommendations).recommendation?.id).toBe("monthly-twice");
    expect(configurationSchema.safeParse({ serviceType: "hoa-thoi", recurrence: monthly }).success).toBe(false);
  });
  it("keeps stored v4 calendar schedules distinct from new fixed cycles", () => {
    const old = storedRecurrenceSchema.parse({ version: 4, period: "month", month: "2026-12", durationMonths: 3, weeks: monthly.weeks });
    expect(old.version).toBe(4);
    if (old.version === 4) expect(deriveRecurrence(old).months[2].slots[1].date).toBe("2027-02-26");
  });
});
