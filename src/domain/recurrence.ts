import * as z from "zod";
import { calendarRecurrenceSchema, calendarSubmissionSchema, deriveCalendar, isCalendarRecurrence, vietnamToday, type CalendarRecurrence } from "./delivery-schedule";
export { vietnamToday } from "./delivery-schedule";

export const MAX_DURATION_WEEKS = 52;
export const MAX_DURATION_MONTHS = 12;
export const MAX_RECOMMENDATIONS = 6;
export const MAX_ENABLED_RECOMMENDATIONS = 3;
export const weekdayLabels = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ nhật"];
const monthSchema = z.string().regex(/^[1-9]\d{3}-(0[1-9]|1[0-2])$/, "Chọn tháng nhận hoa hợp lệ.");
const dateSchema = z.string().refine((v) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + "T12:00:00Z");
  return Number.isFinite(d.valueOf()) && dateOnly(d) === v;
}, "Ngày bắt đầu không hợp lệ.");
function dateOnly(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
export function addMonths(month: string, amount: number) {
  const [year, m] = month.split("-").map(Number);
  return dateOnly(new Date(Date.UTC(year, m - 1 + amount, 1, 12))).slice(0, 7);
}
export function monthWeeks(month: string) {
  if (!monthSchema.safeParse(month).success) return [];
  const [year, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(year, m, 0, 12)).getUTCDate();
  const offset = (new Date(Date.UTC(year, m - 1, 1, 12)).getUTCDay() + 6) % 7;
  return Array.from({ length: Math.ceil((offset + last) / 7) }, (_, i) => {
    const days = Array.from({ length: 7 }, (_, j) => {
      const day = 1 - offset + i * 7 + j;
      return { weekday: j + 1, date: day >= 1 && day <= last ? `${month}-${String(day).padStart(2, "0")}` : null };
    });
    const valid = days.filter((d) => d.date);
    return { weekIndex: i + 1, days, start: valid[0].date!, end: valid.at(-1)!.date! };
  });
}
const weekdays = z.array(z.number().int().min(1).max(7)).min(1, "Chọn ít nhất một thứ nhận hoa.").max(7)
  .refine((v) => new Set(v).size === v.length, "Không chọn trùng thứ nhận hoa.")
  .transform((v) => [...v].sort((a, b) => a - b));
const weeks = z.array(z.object({ weekIndex: z.number().int().min(1).max(6), weekdays }).strict()).min(1, "Chọn ít nhất một tuần.").max(6)
  .refine((v) => new Set(v.map((w) => w.weekIndex)).size === v.length, "Không chọn trùng tuần.")
  .transform((v) => [...v].sort((a, b) => a.weekIndex - b.weekIndex));
const duration = (max: number, unit: string) => z.number({ error: `Nhập số ${unit} liên tục.` }).int(`Số ${unit} phải là số nguyên.`).min(1, `Chọn ít nhất 1 ${unit}.`).max(max, `Chọn tối đa ${max} ${unit}.`);
const weekly = { period: z.literal("week"), weekdays, startDate: dateSchema.optional() };
const monthly = { period: z.literal("month"), month: monthSchema, weeks };
export const recurrenceV4Schema = z.discriminatedUnion("period", [
  z.object({ version: z.literal(4), ...weekly, durationWeeks: duration(MAX_DURATION_WEEKS, "tuần") }).strict(),
  z.object({ version: z.literal(4), ...monthly, durationMonths: duration(MAX_DURATION_MONTHS, "tháng") }).strict(),
]).superRefine(validateMonthStructure);
// New proposals use fixed four-week cycles. Historical v4 calendar schedules keep their original meaning.
const packageChoice = { recommendationId: z.string().regex(/^[a-z0-9-]{1,100}$/), timesPerPeriod: z.number().int().min(1).max(31) };
export const recurrenceV5Schema = z.discriminatedUnion("period", [
  z.object({ version: z.literal(5), ...packageChoice, ...weekly, durationWeeks: duration(MAX_DURATION_WEEKS, "combo") }).strict(),
  z.object({ version: z.literal(5), ...packageChoice, period: z.literal("month"), startDate: dateSchema, durationMonths: duration(MAX_DURATION_MONTHS, "combo"), weeks: weeks.refine((v) => v.every((w) => w.weekIndex <= 4), "Chọn tuần từ 1 đến 4.") }).strict(),
]).superRefine((v, ctx) => {
  const count = v.period === "week" ? v.weekdays.length : v.weeks.reduce((n, w) => n + w.weekdays.length, 0);
  if (count !== v.timesPerPeriod) ctx.addIssue({ code: "custom", path: [v.period === "week" ? "weekdays" : "weeks"], message: `Chọn đúng ${v.timesPerPeriod} lần nhận cho gói này.` });
});
export const recurrenceV6Schema = z.discriminatedUnion("period", [
  z.object({ version: z.literal(6), ...packageChoice, period: z.literal("week"), weekdays, durationWeeks: duration(MAX_DURATION_WEEKS, "combo") }).strict(),
  z.object({ version: z.literal(6), ...packageChoice, period: z.literal("month"), weekdays, durationMonths: duration(MAX_DURATION_MONTHS, "combo") }).strict(),
]).refine((v) => v.timesPerPeriod <= (v.period === "week" ? 7 : 28), { path: ["timesPerPeriod"], message: "Tần suất gói không hợp lệ." });
export const currentRecurrenceSchema = calendarRecurrenceSchema;
const legacyRecurrenceSchema = z.discriminatedUnion("version", [
  recurrenceV6Schema,
  recurrenceV5Schema,
  recurrenceV4Schema,
  z.object({ version: z.literal(1).optional(), period: z.enum(["week", "month"]), timesPerPeriod: z.number().int().min(1).max(31) }).strict(),
  z.discriminatedUnion("period", [
    z.object({ version: z.literal(2), ...weekly }).strict(),
    z.object({ version: z.literal(2), ...monthly }).strict(),
  ]).superRefine(validateMonthStructure),
  z.discriminatedUnion("period", [
    z.object({ version: z.literal(3), ...weekly, durationWeeks: duration(MAX_DURATION_WEEKS, "tuần") }).strict(),
    z.object({ version: z.literal(3), ...monthly }).strict(),
  ]).superRefine(validateMonthStructure),
]);
// A local earlier iteration also used version 5 for a template. Read both strict shapes,
// while new writes accept the calendar shape exclusively.
export const storedRecurrenceSchema = z.unknown().transform((value, ctx) => {
  const parsed = (isCalendarRecurrence(value) ? calendarRecurrenceSchema : legacyRecurrenceSchema).safeParse(value);
  if (!parsed.success) { for (const issue of parsed.error.issues) ctx.addIssue({ ...issue }); return z.NEVER; }
  return parsed.data;
});
function validateMonthStructure(v: { period: string; month?: string; weeks?: { weekIndex: number; weekdays: number[] }[] }, ctx: z.RefinementCtx) {
  if (v.period !== "month" || !v.month || !v.weeks) return;
  const calendar = monthWeeks(v.month);
  v.weeks.forEach((w, i) => {
    const week = calendar[w.weekIndex - 1];
    if (!week) ctx.addIssue({ code: "custom", path: ["weeks", i, "weekIndex"], message: "Tuần không tồn tại trong tháng đã chọn." });
    w.weekdays.forEach((day, j) => {
      if (!week?.days.find((d) => d.weekday === day)?.date) ctx.addIssue({ code: "custom", path: ["weeks", i, "weekdays", j], message: `Thứ đã chọn không nằm trong Tuần ${w.weekIndex} của tháng này.` });
    });
  });
}
export const legacySubmissionRecurrenceSchema = z.discriminatedUnion("version", [recurrenceV6Schema, recurrenceV5Schema, recurrenceV4Schema]).superRefine((v, ctx) => {
  if (v.version === 6) return;
  const today = vietnamToday();
  if (v.period === "week" || v.version === 5) {
    if (v.startDate && v.startDate < today) ctx.addIssue({ code: "custom", path: ["startDate"], message: "Ngày bắt đầu đã ở quá khứ." });
  } else {
    if (v.month < today.slice(0, 7)) ctx.addIssue({ code: "custom", path: ["month"], message: "Tháng nhận hoa đã ở quá khứ." });
    v.weeks.forEach((w, i) => w.weekdays.forEach((day, j) => {
      const date = monthWeeks(v.month)[w.weekIndex - 1]?.days.find((d) => d.weekday === day)?.date;
      if (date && date < today) ctx.addIssue({ code: "custom", path: ["weeks", i, "weekdays", j], message: `Ngày nhận trong Tuần ${w.weekIndex} đã ở quá khứ; vui lòng sửa lịch.` });
    }));
  }
});
export const submissionRecurrenceSchema = calendarSubmissionSchema;
export type RecurrenceV4 = z.infer<typeof recurrenceV4Schema>;
export type RecurrenceV5 = z.infer<typeof recurrenceV5Schema>;
export type RecurrenceV6 = z.infer<typeof recurrenceV6Schema>;
export type StoredRecurrence = z.infer<typeof storedRecurrenceSchema>;
const normalizedRecommendationSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,100}$/),
  period: z.enum(["week", "month"]),
  bouquetsPerPeriod: z.number().int().min(1).max(31),
  suggestedPrice: z.object({ min: z.number().int().positive(), max: z.number().int().positive(), basis: z.enum(["delivery", "month"]) }).strict().refine((p) => p.min <= p.max, { message: "Giá từ phải nhỏ hơn hoặc bằng giá đến.", path: ["max"] }),
  enabled: z.boolean(),
}).strict().refine((r) => r.period !== "week" || r.bouquetsPerPeriod <= 7, { message: "Gói tuần có tối đa 7 bó.", path: ["bouquetsPerPeriod"] });
export const recommendationSchema = z.preprocess((value) => {
  if (value && typeof value === "object" && "timesPerPeriod" in value && !("bouquetsPerPeriod" in value)) {
    const { timesPerPeriod, ...rest } = value;
    return { ...rest, bouquetsPerPeriod: timesPerPeriod };
  }
  return value;
}, normalizedRecommendationSchema);
export type Recommendation = z.infer<typeof recommendationSchema>;
export const recommendationsSchema = z.array(recommendationSchema).max(MAX_RECOMMENDATIONS).superRefine((rows, ctx) => {
  const ids = new Set<string>(), pairs = new Set<string>();
  rows.forEach((r, i) => {
    if (ids.has(r.id)) ctx.addIssue({ code: "custom", path: [i, "id"], message: "ID gợi ý bị trùng." });
    ids.add(r.id);
    const pair = `${r.period}:${r.bouquetsPerPeriod}`;
    if (r.enabled && pairs.has(pair)) ctx.addIssue({ code: "custom", path: [i, "bouquetsPerPeriod"], message: "Tần suất này đã có gợi ý đang bật." });
    if (r.enabled) pairs.add(pair);
  });
  if (rows.filter((r) => r.enabled).length > MAX_ENABLED_RECOMMENDATIONS) ctx.addIssue({ code: "custom", message: "Chỉ bật tối đa 3 gợi ý." });
});
export const initialRecommendations: Recommendation[] = [
  { id: "monthly-once", period: "month", bouquetsPerPeriod: 1, suggestedPrice: { min: 500000, max: 700000, basis: "delivery" }, enabled: true },
  { id: "monthly-twice", period: "month", bouquetsPerPeriod: 2, suggestedPrice: { min: 950000, max: 1300000, basis: "month" }, enabled: true },
  { id: "weekly-once", period: "week", bouquetsPerPeriod: 1, suggestedPrice: { min: 1800000, max: 2400000, basis: "month" }, enabled: true },
];
export const periodLabel = (p: string) => p === "week" ? "tuần" : "tháng";
export const monthLabel = (m: string) => m.split("-").reverse().join("/");
export function parseVndAmount(value: string) {
  const raw = value.trim();
  if (!/^(\d+|\d{1,3}(\.\d{3})+)$/.test(raw)) return null;
  const amount = Number(raw.replaceAll(".", ""));
  return Number.isSafeInteger(amount) ? amount : null;
}
export const scheduleDateLabel = (d: string) => d.split("-").reverse().join("/");
export function recommendationPrice(r: Pick<Recommendation, "suggestedPrice">) {
  const p = r.suggestedPrice;
  return `${new Intl.NumberFormat("vi-VN").format(p.min)}–${new Intl.NumberFormat("vi-VN").format(p.max)} ₫/${p.basis === "delivery" ? "lần" : "tháng"}`;
}
export function cycleDate(startDate: string, weekIndex: number, weekday: number, cycle = 0) {
  const start = new Date(startDate + "T12:00:00Z");
  const offset = (weekday - ((start.getUTCDay() + 6) % 7 + 1) + 7) % 7;
  start.setUTCDate(start.getUTCDate() + cycle * 28 + (weekIndex - 1) * 7 + offset);
  return dateOnly(start);
}
export function deriveRecurrence(r: RecurrenceV4 | RecurrenceV5 | RecurrenceV6 | CalendarRecurrence) {
  if (isCalendarRecurrence(r)) return deriveCalendar(r);
  if (r.version === 6) {
    const combos = r.period === "week" ? r.durationWeeks : r.durationMonths;
    return { derivedCount: r.timesPerPeriod, plannedTotalDeliveries: r.timesPerPeriod * combos, totalWeeks: combos * (r.period === "week" ? 1 : 4), months: [], cycles: [], monthStart: undefined, monthEnd: undefined, resolvedCount: 0, unresolvedCount: r.timesPerPeriod * combos };
  }
  const derivedCount = r.period === "week" ? r.weekdays.length : r.weeks.reduce((n, w) => n + w.weekdays.length, 0);
  const plannedTotalDeliveries = derivedCount * (r.period === "week" ? r.durationWeeks : r.durationMonths);
  if (r.version === 5) {
    const cycles = r.period === "month" ? Array.from({ length: r.durationMonths }, (_, i) => ({ cycle: i + 1, startDate: cycleDate(r.startDate, 1, ((new Date(r.startDate + "T12:00:00Z").getUTCDay() + 6) % 7) + 1, i), slots: r.weeks.flatMap((w) => w.weekdays.map((weekday) => ({ weekIndex: w.weekIndex, weekday, date: cycleDate(r.startDate, w.weekIndex, weekday, i) }))) })) : [];
    return { derivedCount, plannedTotalDeliveries, months: [], cycles, monthStart: undefined, monthEnd: undefined, totalWeeks: r.period === "week" ? r.durationWeeks : r.durationMonths * 4, resolvedCount: r.period === "month" ? plannedTotalDeliveries : 0, unresolvedCount: 0 };
  }
  const months = r.period === "month" ? Array.from({ length: r.durationMonths }, (_, i) => {
    const month = addMonths(r.month, i), calendar = monthWeeks(month);
    const slots = r.weeks.flatMap((w) => w.weekdays.map((weekday) => ({ weekIndex: w.weekIndex, weekday, date: calendar[w.weekIndex - 1]?.days.find((d) => d.weekday === weekday)?.date ?? null })));
    return { month, slots };
  }) : [];
  const resolvedCount = months.reduce((n, m) => n + m.slots.filter((s) => s.date).length, 0);
  return { derivedCount, plannedTotalDeliveries, months, ...(r.period === "month" ? { monthStart: r.month, monthEnd: addMonths(r.month, r.durationMonths - 1), resolvedCount, unresolvedCount: plannedTotalDeliveries - resolvedCount } : {}) };
}
export function matchRecommendation(r: RecurrenceV4 | RecurrenceV5 | RecurrenceV6 | CalendarRecurrence, rows: Recommendation[]) {
  if (isCalendarRecurrence(r)) return rows.find((v) => v.enabled && v.period === r.period && v.bouquetsPerPeriod === r.bouquetsPerPeriod);
  const count = deriveRecurrence(r).derivedCount;
  return rows.find((v) => v.enabled && v.period === r.period && v.bouquetsPerPeriod === count && (r.version === 4 || v.id === r.recommendationId));
}
export function recurrenceSnapshot(r: RecurrenceV4 | RecurrenceV5 | RecurrenceV6 | CalendarRecurrence, rows: Recommendation[]) {
  const matched = matchRecommendation(r, rows);
  return { ...deriveRecurrence(r), recommendation: matched ? structuredClone(matched) : null };
}
export type RecurrenceSnapshot = ReturnType<typeof recurrenceSnapshot>;
