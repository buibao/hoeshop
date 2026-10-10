import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { addDays, calendarRecurrenceSchema, calendarSubmissionSchema, deriveCalendar, periodKey, scheduleGroups, scheduleFeasibility, selectionBlock, type CalendarRecurrence } from "@/domain/delivery-schedule";
import { canonical, cartKey, readCart, serializeCart } from "@/domain/cart";
import { configurationSchema, storedConfigurationSchema } from "@/domain/schemas";
import { initialRecommendations, recommendationSchema, recurrenceSnapshot, storedRecurrenceSchema } from "@/domain/recurrence";
export const weekly = { version: 5 as const, period: "week" as const, bouquetsPerPeriod: 2, comboCount: 2, startPeriod: "2026-10-12", deliveryDates: ["2026-10-14", "2026-10-17", "2026-10-20", "2026-10-23"] };
const monthly = { version: 5 as const, period: "month" as const, bouquetsPerPeriod: 2, comboCount: 2, startPeriod: "2026-10", deliveryDates: ["2026-10-15", "2026-10-28", "2026-11-05", "2026-11-22"] };
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-10T10:00:00Z")); });
afterEach(() => vi.useRealTimers());
describe("exact delivery dates and consecutive calendar periods", () => {
  it("groups a two-bouquet two-week package with different weekdays", () => {
    const result = deriveCalendar(calendarSubmissionSchema.parse(weekly));
    expect(result).toMatchObject({ totalBouquets: 4, endPeriod: "2026-10-19", timezone: "Asia/Ho_Chi_Minh", unresolvedCount: 0 });
    expect(result.periodGroups.map((g) => [g.start, g.end, g.dates.length])).toEqual([["2026-10-12", "2026-10-18", 2], ["2026-10-19", "2026-10-25", 2]]);
  });
  it("groups exact dates per calendar month rather than rolling four-week periods", () => {
    const result = deriveCalendar(calendarSubmissionSchema.parse(monthly));
    expect(result.periodGroups.map((g) => [g.start, g.end, g.dates])).toEqual([["2026-10-01", "2026-10-31", ["2026-10-15", "2026-10-28"]], ["2026-11-01", "2026-11-30", ["2026-11-05", "2026-11-22"]]]);
  });
  it.each([
    ["three plus one", ["2026-10-13", "2026-10-14", "2026-10-17", "2026-10-20"]],
    ["gap", ["2026-10-14", "2026-10-17", "2026-10-27", "2026-10-30"]],
    ["missing", ["2026-10-14", "2026-10-17", "2026-10-20"]],
    ["duplicate", ["2026-10-14", "2026-10-14", "2026-10-20", "2026-10-23"]],
  ])("rejects %s weekly allocations even when total can match", (_label, deliveryDates) => expect(calendarRecurrenceSchema.safeParse({ ...weekly, deliveryDates }).success).toBe(false));
  it("rejects forged, non-Monday or missing anchors", () => {
    for (const startPeriod of ["2026-10-14", "2026-10-05", "", "2026-10", "2026-99-99"]) expect(calendarRecurrenceSchema.safeParse({ ...weekly, startPeriod }).success).toBe(false);
    expect(calendarRecurrenceSchema.safeParse({ ...monthly, startPeriod: "2026-10-01" }).success).toBe(false);
  });
  it("rejects month imbalance and omitted first month", () => {
    expect(calendarRecurrenceSchema.safeParse({ ...monthly, deliveryDates: ["2026-10-15", "2026-10-20", "2026-10-28", "2026-11-05"] }).success).toBe(false);
    expect(calendarRecurrenceSchema.safeParse({ ...monthly, deliveryDates: ["2026-11-15", "2026-11-28", "2026-12-05", "2026-12-22"] }).success).toBe(false);
  });
  it("handles weeks across month and year boundaries as one group", () => {
    expect(periodKey("2027-01-01", "week")).toBe("2026-12-28");
    const r = { ...weekly, startPeriod: "2026-12-28", deliveryDates: ["2026-12-30", "2027-01-02", "2027-01-05", "2027-01-09"] };
    expect(calendarSubmissionSchema.parse(r).deliveryDates).toEqual(r.deliveryDates);
    expect(scheduleGroups(r)[0].end).toBe("2027-01-03");
  });
  it("handles December plus three months and leap February without an extra period", () => {
    const r = { ...monthly, startPeriod: "2026-12", comboCount: 3, bouquetsPerPeriod: 1, deliveryDates: ["2026-12-15", "2027-01-16", "2027-02-17"] };
    expect(deriveCalendar(calendarRecurrenceSchema.parse(r)).endPeriod).toBe("2027-02");
    expect(scheduleGroups({ ...r, startPeriod: "2028-02", comboCount: 1 })[0].end).toBe("2028-02-29");
    expect(calendarRecurrenceSchema.safeParse({ ...r, comboCount: 1, startPeriod: "2027-02", deliveryDates: ["2027-02-30"] }).success).toBe(false);
  });
  it("allows today with a past Monday anchor and revalidates Vietnam midnight", () => {
    const r = { ...weekly, startPeriod: "2026-10-05", bouquetsPerPeriod: 1, comboCount: 1, deliveryDates: ["2026-10-10"] };
    expect(calendarSubmissionSchema.safeParse(r).success).toBe(true);
    vi.setSystemTime(new Date("2026-10-10T17:00:00Z"));
    expect(calendarSubmissionSchema.safeParse(r).success).toBe(false);
    expect(storedRecurrenceSchema.safeParse(r).success).toBe(true);
  });
  it.each([0, -1, 1.5, "2", "", null, Infinity, 53])("rejects invalid combo count %s", (comboCount) => expect(calendarRecurrenceSchema.safeParse({ ...weekly, comboCount }).success).toBe(false));
  it.each([0, -1, 1.5, "2", "", null, Infinity, 8])("rejects invalid weekly bouquet count %s", (bouquetsPerPeriod) => expect(calendarRecurrenceSchema.safeParse({ ...weekly, bouquetsPerPeriod }).success).toBe(false));
  it("rejects fake snapshot, price, template and unresolved fields", () => {
    for (const extra of [{ price: 1 }, { weekdays: [1] }, { weeks: [] }, { unresolvedCount: 2 }, { recurrenceSnapshot: {} }, { plannedTotalDeliveries: 4 }]) expect(calendarRecurrenceSchema.safeParse({ ...weekly, ...extra }).success).toBe(false);
  });
});
describe("calendar interaction rules and preserved drafts", () => {
  it("supports the maximum weekly package and reuses identical quota groups for day checks", () => {
    const r = { ...weekly, bouquetsPerPeriod: 7, comboCount: 52, deliveryDates: Array.from({ length: 364 }, (_, i) => addDays("2026-10-12", i)) };
    const parsed = calendarSubmissionSchema.parse(r), groups = scheduleGroups(parsed);
    expect(groups).toHaveLength(52); expect(groups.every((g) => g.dates.length === 7)).toBe(true);
    expect(deriveCalendar(parsed).totalBouquets).toBe(364);
    for (const date of [r.deliveryDates[0], addDays(r.deliveryDates.at(-1)!, 1)]) expect(selectionBlock(parsed, date, "2026-10-10", groups)).toBe(selectionBlock(parsed, date, "2026-10-10"));
  });
  it("blocks full quotas, outside dates and allows removing selected dates", () => {
    expect(selectionBlock(weekly, "2026-10-15", "2026-10-10")).toContain("đã đủ 2 ngày");
    expect(selectionBlock(weekly, "2026-10-26", "2026-10-10")).toContain("ngoài");
    expect(selectionBlock(weekly, "2026-10-14", "2026-10-10")).toBe("");
  });
  it("keeps an empty first cycle anchored when later dates remain", () => {
    const draft = { ...weekly, deliveryDates: ["2026-10-20", "2026-10-23"] };
    expect(scheduleGroups(draft)[0].dates).toEqual([]);
    expect(selectionBlock(draft, "2026-10-14", "2026-10-10")).toBe("");
    expect(calendarRecurrenceSchema.safeParse(draft).success).toBe(false);
  });
  it("reports overflow after N/C decrease without truncating or shifting dates", () => {
    const draft = { ...weekly, bouquetsPerPeriod: 1, comboCount: 1 };
    expect(scheduleGroups(draft)[0].dates).toHaveLength(2);
    expect(draft.deliveryDates).toHaveLength(4);
    expect(selectionBlock(draft, "2026-10-16", "2026-10-10")).not.toBe("");
    expect(selectionBlock(draft, "2026-10-23", "2026-10-10")).toBe("");
    expect(calendarRecurrenceSchema.safeParse(draft).success).toBe(false);
  });
  it("rejects a Sunday start when two bouquets cannot fit the first week", () => {
    const draft = { ...weekly, startPeriod: "", deliveryDates: [] };
    expect(selectionBlock(draft, "2026-10-11", "2026-10-11")).toContain("chỉ còn 1 ngày");
    expect(selectionBlock(draft, "2026-10-14", "2026-10-11")).toBe("");
  });
  it("checks every month for feasibility rather than reducing February's quota", () => {
    const draft = { ...monthly, bouquetsPerPeriod: 31, startPeriod: "2027-01", deliveryDates: [] };
    expect(scheduleFeasibility(draft, "2026-10-10")).toContain("28 ngày");
    expect(selectionBlock({ ...draft, startPeriod: "" }, "2027-01-15", "2026-10-10")).toContain("28 ngày");
    expect(draft.bouquetsPerPeriod).toBe(31);
  });
  it("uses N rather than N×C for price matching and tolerates disabled suggestions", () => {
    const r = calendarRecurrenceSchema.parse({ ...monthly, comboCount: 3, deliveryDates: [...monthly.deliveryDates, "2026-12-03", "2026-12-18"] });
    const snapshot = recurrenceSnapshot(r, initialRecommendations);
    expect(snapshot.recommendation?.id).toBe("monthly-twice");
    expect(snapshot.recommendation?.suggestedPrice.min).toBe(950000);
    expect(recurrenceSnapshot(r, initialRecommendations.map((row) => ({ ...row, enabled: false }))).recommendation).toBeNull();
  });
  it("adapts legacy recommendation counts and rejects two competing count fields", () => {
    const { bouquetsPerPeriod, ...row } = initialRecommendations[1];
    expect(recommendationSchema.parse({ ...row, timesPerPeriod: bouquetsPerPeriod })).toEqual(initialRecommendations[1]);
    expect(recommendationSchema.safeParse({ ...initialRecommendations[1], timesPerPeriod: 2 }).success).toBe(false);
  });
  it("canonicalizes date order and keeps different package counts distinct after reload", () => {
    const make = (r: CalendarRecurrence) => ({ lineId: randomUUID(), productId: "test", expectedRevision: "r", quantity: 2, configuration: storedConfigurationSchema.parse({ serviceType: "hoa-thoi", recurrence: r }) });
    const a = make(weekly), b = make({ ...weekly, deliveryDates: [...weekly.deliveryDates].reverse() });
    expect(cartKey(a)).toBe(cartKey(b)); expect(canonical(weekly)).toBe(canonical({ ...weekly, deliveryDates: [...weekly.deliveryDates].reverse() }));
    expect(cartKey(a)).not.toBe(cartKey(make({ ...weekly, bouquetsPerPeriod: 1, deliveryDates: ["2026-10-14", "2026-10-20"] })));
    expect(readCart(serializeCart([a]))).toEqual([a]);
    expect(configurationSchema.safeParse({ serviceType: "hoa-thoi", recurrence: { version: 6, period: "week", timesPerPeriod: 1, recommendationId: "weekly-once", weekdays: [1], durationWeeks: 1 } }).success).toBe(false);
  });
});
