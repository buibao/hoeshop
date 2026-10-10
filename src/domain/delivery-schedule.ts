import * as z from "zod";

export const MAX_WEEK_COMBOS = 52;
export const MAX_MONTH_COMBOS = 12;
export type SchedulePeriod = "week" | "month";
export type ScheduleDraft = { period: SchedulePeriod; bouquetsPerPeriod: number; comboCount: number; startPeriod: string; deliveryDates: string[] };

export function vietnamToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function dateOnly(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
export function addDays(date: string, amount: number) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + amount);
  return dateOnly(d);
}
export function nextMonth(month: string, amount = 1) {
  const [year, m] = month.split("-").map(Number);
  return dateOnly(new Date(Date.UTC(year, m - 1 + amount, 1, 12))).slice(0, 7);
}
export function periodKey(date: string, period: SchedulePeriod) {
  if (period === "month") return date.slice(0, 7);
  const weekday = (new Date(date + "T12:00:00Z").getUTCDay() + 6) % 7;
  return addDays(date, -weekday);
}
export const shortDate = (date: string) => date.split("-").reverse().join("/");
export function fullDate(date: string) {
  return new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(date + "T12:00:00Z"));
}
export function validPackage(v: Pick<ScheduleDraft, "period" | "bouquetsPerPeriod" | "comboCount">) {
  return Number.isInteger(v.bouquetsPerPeriod) && v.bouquetsPerPeriod >= 1 && v.bouquetsPerPeriod <= (v.period === "week" ? 7 : 31)
    && Number.isInteger(v.comboCount) && v.comboCount >= 1 && v.comboCount <= (v.period === "week" ? MAX_WEEK_COMBOS : MAX_MONTH_COMBOS);
}
export function scheduleGroups(v: ScheduleDraft) {
  if (!validPackage(v) || !v.startPeriod || !/^\d{4}-\d{2}(-\d{2})?$/.test(v.startPeriod)) return [];
  const datesByPeriod = new Map<string, string[]>();
  for (const date of v.deliveryDates) {
    const key = periodKey(date, v.period);
    const bucket = datesByPeriod.get(key) || [];
    bucket.push(date);
    datesByPeriod.set(key, bucket);
  }
  return Array.from({ length: v.comboCount }, (_, index) => {
    const key = v.period === "week" ? addDays(v.startPeriod, index * 7) : nextMonth(v.startPeriod, index);
    const start = v.period === "week" ? key : `${key}-01`;
    const end = v.period === "week" ? addDays(key, 6) : addDays(`${nextMonth(key)}-01`, -1);
    const dates = [...(datesByPeriod.get(key) || [])].sort();
    return { key, start, end, dates, required: v.bouquetsPerPeriod, label: v.period === "week" ? `Tuần ${shortDate(start)}–${shortDate(end)}` : `Tháng ${key.slice(5)}/${key.slice(0, 4)}` };
  });
}
export function scheduleFeasibility(v: ScheduleDraft, today: string, groups = scheduleGroups(v)) {
  for (const group of groups) {
    const start = group.start < today ? today : group.start;
    const available = Math.max(0, Math.round((new Date(group.end + "T12:00:00Z").valueOf() - new Date(start + "T12:00:00Z").valueOf()) / 86400000) + 1);
    if (available < group.required) return `${group.label} chỉ còn ${available} ngày có thể nhận; gói cần ${group.required} ngày. Hãy giảm số bó hoặc chọn thời gian khác.`;
  }
  return "";
}
export function selectionBlock(v: ScheduleDraft, date: string, today: string, knownGroups?: ReturnType<typeof scheduleGroups>) {
  if (v.deliveryDates.includes(date)) return "";
  if (date < today) return "Ngày đã ở quá khứ.";
  if (!validPackage(v)) return "Nhập số bó và số combo hợp lệ trước khi chọn ngày.";
  const draft = v.startPeriod ? v : { ...v, startPeriod: periodKey(date, v.period) };
  const groups = v.startPeriod && knownGroups ? knownGroups : scheduleGroups(draft);
  const unavailable = scheduleFeasibility(draft, today, groups);
  if (unavailable) return unavailable;
  const group = groups.find((g) => g.key === periodKey(date, v.period));
  if (!group) return "Ngày này nằm ngoài các chu kỳ liên tiếp đã chọn.";
  if (group.dates.length >= group.required) return `${group.label} đã đủ ${group.required} ngày; bạn vẫn có thể bỏ ngày đã chọn.`;
  if (v.deliveryDates.length >= v.bouquetsPerPeriod * v.comboCount) return "Đã đạt tổng số ngày của gói; hãy bỏ ngày không phù hợp trước.";
  return "";
}
const isoDate = z.string().refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(new Date(v + "T12:00:00Z").valueOf()) && dateOnly(new Date(v + "T12:00:00Z")) === v, "Chọn ngày lịch hợp lệ.");
const integer = (label: string, max: number) => z.number({ error: `Nhập ${label}.` }).int(`${label} phải là số nguyên.`).min(1, `${label} phải từ 1.`).max(max, `${label} tối đa ${max}.`);
const fields = { version: z.literal(5), startPeriod: z.string().max(10), deliveryDates: z.array(isoDate).max(372).refine((v) => new Set(v).size === v.length, "Không chọn trùng ngày nhận.").transform((v) => [...v].sort()) };
export const calendarRecurrenceSchema = z.discriminatedUnion("period", [
  z.object({ ...fields, period: z.literal("week"), bouquetsPerPeriod: integer("Số bó mỗi tuần", 7), comboCount: integer("Số combo", MAX_WEEK_COMBOS) }).strict(),
  z.object({ ...fields, period: z.literal("month"), bouquetsPerPeriod: integer("Số bó mỗi tháng", 31), comboCount: integer("Số combo", MAX_MONTH_COMBOS) }).strict(),
]).superRefine((v, ctx) => {
  const first = v.deliveryDates[0];
  if (!first) { ctx.addIssue({ code: "custom", path: ["deliveryDates"], message: "Chọn ngày đầu tiên để xác định thời gian bắt đầu combo." }); return; }
  if (periodKey(first, v.period) !== v.startPeriod) { ctx.addIssue({ code: "custom", path: ["startPeriod"], message: "Thời gian bắt đầu phải là chu kỳ chứa ngày nhận sớm nhất." }); return; }
  const groups = scheduleGroups(v);
  for (const group of groups) if (group.dates.length !== group.required) ctx.addIssue({ code: "custom", path: ["deliveryDates"], message: `${group.label} đang chọn ${group.dates.length}/${group.required} ngày. Chọn đúng ${group.required} ngày trong chu kỳ này.` });
  if (v.deliveryDates.some((date) => !groups.some((g) => g.key === periodKey(date, v.period)))) ctx.addIssue({ code: "custom", path: ["deliveryDates"], message: "Có ngày nằm ngoài các chu kỳ liên tiếp. Bỏ ngày không phù hợp hoặc chọn lại thời gian nhận." });
});
export const calendarSubmissionSchema = calendarRecurrenceSchema.superRefine((v, ctx) => {
  const today = vietnamToday();
  if (v.deliveryDates.some((date) => date < today)) ctx.addIssue({ code: "custom", path: ["deliveryDates"], message: "Có ngày nhận đã ở quá khứ. Vui lòng chọn lại lịch nhận." });
  const message = scheduleFeasibility(v, today);
  if (message) ctx.addIssue({ code: "custom", path: ["deliveryDates"], message });
});
export type CalendarRecurrence = z.infer<typeof calendarRecurrenceSchema>;
export function isCalendarRecurrence(value: unknown): value is CalendarRecurrence {
  return !!value && typeof value === "object" && "bouquetsPerPeriod" in value && "deliveryDates" in value;
}
export function deriveCalendar(v: CalendarRecurrence) {
  const periodGroups = scheduleGroups(v);
  return { timezone: "Asia/Ho_Chi_Minh", periodGroups, endPeriod: periodGroups.at(-1)!.key, totalBouquets: v.bouquetsPerPeriod * v.comboCount, derivedCount: v.bouquetsPerPeriod, plannedTotalDeliveries: v.bouquetsPerPeriod * v.comboCount, months: [], cycles: [], monthStart: undefined, monthEnd: undefined, totalWeeks: v.period === "week" ? v.comboCount : undefined, resolvedCount: v.deliveryDates.length, unresolvedCount: 0 };
}
