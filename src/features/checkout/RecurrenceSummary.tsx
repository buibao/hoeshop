"use client";
import {
  deriveRecurrence, recurrenceV4Schema, storedRecurrenceSchema, matchRecommendation,
  weekdayLabels, periodLabel, monthLabel, scheduleDateLabel, recommendationPrice,
  monthWeeks, type RecurrenceSnapshot, type Recommendation,
} from "@/domain/recurrence";
import { isCalendarRecurrence } from "@/domain/delivery-schedule";
import { HoaThoiScheduleProgress } from "./HoaThoiScheduleProgress";

export function RecurrenceSummary({ recurrence, recommendations = [], snapshot, live = false, incomplete = false }: {
  recurrence?: unknown;
  recommendations?: Recommendation[];
  snapshot?: RecurrenceSnapshot;
  live?: boolean;
  incomplete?: boolean;
}) {
  const parsed = storedRecurrenceSchema.safeParse(recurrence);
  if (!parsed.success) return <aside className="ht-summary"><h3>Nhịp hoa của bạn</h3><p aria-live={live ? "polite" : undefined}>{incomplete ? "Chọn thứ nhận hoa và số combo hợp lệ." : "Chọn gói để Hòe tư vấn"}</p></aside>;
  const r = parsed.data;
  if (isCalendarRecurrence(r)) return <HoaThoiScheduleProgress draft={r} recommendations={recommendations} historical={!!snapshot} receiptPrice={snapshot?.recommendation} />;
  if (r.version === 6) {
    const derived = snapshot || deriveRecurrence(r);
    const matched = snapshot ? snapshot.recommendation : matchRecommendation(r, recommendations);
    const combos = r.period === "week" ? r.durationWeeks : r.durationMonths;
    return <aside className="ht-summary">
      <p className="ht-helper">Cấu hình theo phiên bản cũ — thứ nhận mong muốn, chưa chọn ngày cụ thể trên calendar.</p>
      <h3>Nhịp hoa của bạn</h3>
      <p className="ht-total" aria-live={live ? "polite" : undefined} aria-atomic="true">{r.timesPerPeriod} lần/{periodLabel(r.period)} × {combos} combo<br /><strong>Tổng: {derived.plannedTotalDeliveries} lần nhận dự kiến</strong></p>
      <p>Thời gian: {derived.totalWeeks} tuần{r.period === "month" ? ` · ${combos} tháng (4 tuần/tháng)` : ""}</p>
      <p>Thứ nhận mong muốn: {r.weekdays.map((d) => weekdayLabels[d - 1]).join(", ")}</p>
      <p className="ht-helper">Ngày bắt đầu, tuần giao và giờ nhận sẽ được Hòe tư vấn sau.</p>
      <div className="ht-price">{matched ? <><p>{snapshot ? "Gợi ý tham khảo lúc tiếp nhận" : "Giá tham khảo"}</p><strong>{recommendationPrice(matched)}</strong><p>Hòe sẽ xác nhận giá cho số combo bạn chọn.</p></> : <p>Hòe sẽ tư vấn giá phù hợp</p>}</div>
    </aside>;
  }
  if (r.version === 5) {
    const derived = snapshot || deriveRecurrence(r);
    const matched = snapshot ? snapshot.recommendation : matchRecommendation(r, recommendations);
    const combos = r.period === "week" ? r.durationWeeks : r.durationMonths;
    return <aside className="ht-summary">
      <p className="ht-helper">Cấu hình theo phiên bản cũ — lịch mẫu, chưa chọn ngày cụ thể trên calendar.</p>
      <h3>Nhịp hoa của bạn</h3>
      <p className="ht-total" aria-live={live ? "polite" : undefined} aria-atomic="true">{r.timesPerPeriod} lần/{periodLabel(r.period)} × {combos} combo<br /><strong>Tổng: {derived.plannedTotalDeliveries} lần nhận dự kiến</strong></p>
      <p>Thời gian: {r.period === "week" ? combos : combos * 4} tuần{r.period === "month" ? ` · ${combos} tháng (4 tuần/tháng)` : ""}</p>
      <p>{r.startDate ? `Ngày bắt đầu: ${scheduleDateLabel(r.startDate)}` : "Ngày bắt đầu: Hòe sẽ xác nhận"}</p>
      {r.period === "week" ? <p>{r.weekdays.map((d) => weekdayLabels[d - 1]).join(", ")}</p> : <details className="ht-month-detail"><summary>Lịch dự kiến theo combo</summary>
        {derived.cycles?.map((cycle) => <div key={cycle.cycle} className="ht-month-preview"><strong>Combo {cycle.cycle} · bắt đầu {scheduleDateLabel(cycle.startDate)}</strong><ul>{cycle.slots.map((s) => <li key={`${s.weekIndex}-${s.weekday}`}>Tuần {s.weekIndex} · {weekdayLabels[s.weekday - 1]} · {scheduleDateLabel(s.date)}</li>)}</ul></div>)}
      </details>}
      <div className="ht-price">{matched ? <><p>{snapshot ? "Gợi ý tham khảo lúc tiếp nhận" : "Giá tham khảo"}</p><strong>{recommendationPrice(matched)}</strong><p>Hòe sẽ xác nhận giá cho số combo bạn chọn.</p></> : <p>Hòe sẽ tư vấn giá phù hợp</p>}</div>
      <p className="ht-helper">Lịch khách đề xuất — chờ Hòe xác nhận</p>
    </aside>;
  }
  if ("timesPerPeriod" in r) return <aside className="ht-summary"><p className="ht-helper">Cấu hình theo phiên bản cũ</p><p>{r.timesPerPeriod} lần/{periodLabel(r.period)}</p><p>Chưa chọn lịch cụ thể</p></aside>;
  const current = recurrenceV4Schema.safeParse(r);
  const derived = current.success ? (snapshot || deriveRecurrence(current.data)) : r.period === "week" && "durationWeeks" in r ? deriveRecurrence({ ...r, version: 4 }) : undefined;
  const count = r.period === "week" ? r.weekdays.length : r.weeks.reduce((n, w) => n + w.weekdays.length, 0);
  const duration = r.period === "week" && "durationWeeks" in r ? r.durationWeeks : r.period === "month" && "durationMonths" in r ? r.durationMonths : undefined;
  const matched = snapshot ? snapshot.recommendation : current.success ? matchRecommendation(current.data, recommendations) : undefined;
  const months = derived?.months ?? (r.period === "month" ? [{ month: r.month, slots: r.weeks.flatMap((w) => w.weekdays.map((weekday) => ({ weekIndex: w.weekIndex, weekday, date: monthWeeks(r.month)[w.weekIndex - 1]?.days.find((d) => d.weekday === weekday)?.date ?? null }))) }] : []);
  return <aside className="ht-summary">
    <p className="ht-helper">Cấu hình theo phiên bản cũ — lịch mẫu, chưa chọn ngày cụ thể trên calendar.</p>
    <h3>Nhịp hoa của bạn</h3>
    <p className="ht-total" aria-live={live ? "polite" : undefined} aria-atomic="true">
      {count} lần/{periodLabel(r.period)}{duration ? ` × ${duration} ${periodLabel(r.period)} liên tục` : ""}
      {derived ? <><br /><strong>Tổng: {derived.plannedTotalDeliveries} lần nhận dự kiến</strong></> : null}
    </p>
    {!duration ? <p>Chưa ghi nhận số {periodLabel(r.period)} liên tục</p> : null}
    {r.period === "week" ? <>
      <p>{r.weekdays.map((d) => weekdayLabels[d - 1]).join(", ")}</p>
      <p>{r.startDate ? `Ngày bắt đầu mong muốn: ${scheduleDateLabel(r.startDate)}` : "Tuần bắt đầu: Hòe sẽ xác nhận"}</p>
    </> : <>
      <p>Tháng bắt đầu: {monthLabel(r.month)}{derived?.monthEnd ? ` · Phạm vi ${monthLabel(r.month)}–${monthLabel(derived.monthEnd)}` : ""}</p>
      {derived?.unresolvedCount ? <p>{derived.plannedTotalDeliveries} lần dự kiến · {derived.resolvedCount} ngày đã xác định · {derived.unresolvedCount} lần cần Hòe tư vấn lịch</p> : null}
      <details className="ht-month-detail"><summary>Lịch dự kiến theo tháng</summary>
        {months.map((m) => <div key={m.month} className="ht-month-preview"><strong>Tháng {monthLabel(m.month)}</strong><ul>
          {[...m.slots].sort((a, b) => a.weekIndex - b.weekIndex || a.weekday - b.weekday).map((s) => <li key={`${s.weekIndex}-${s.weekday}`}>Tuần {s.weekIndex} · {weekdayLabels[s.weekday - 1]} · {s.date ? scheduleDateLabel(s.date) : "Cần Hòe xác nhận ngày phù hợp"}</li>)}
        </ul></div>)}
      </details>
    </>}
    <div className="ht-price">
      {matched ? <><p>{snapshot ? "Gợi ý tham khảo lúc tiếp nhận" : "Giá tham khảo"}</p><strong>{recommendationPrice(matched)}</strong>
        <p>{matched.suggestedPrice.basis === "month" ? "Khoảng giá trên theo tháng; Hòe sẽ tư vấn giá cho combo bạn chọn." : "Khoảng giá trên cho mỗi lần nhận; Hòe sẽ tư vấn giá cho combo bạn chọn."}</p>
      </> : <p>Hòe sẽ tư vấn giá phù hợp</p>}
    </div>
    <p className="ht-helper">Lịch khách đề xuất — chờ Hòe xác nhận</p>
  </aside>;
}
