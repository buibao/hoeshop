"use client";
import { Check, CalendarDays, X } from "lucide-react";
import { scheduleGroups, fullDate, validPackage, periodKey, type ScheduleDraft } from "@/domain/delivery-schedule";
import { recommendationPrice, type Recommendation } from "@/domain/recurrence";

export function HoaThoiScheduleProgress({ draft, recommendations = [], receiptPrice, historical = false, remove }: { draft: ScheduleDraft; recommendations?: Recommendation[]; receiptPrice?: Recommendation | null; historical?: boolean; remove?: (date: string) => void }) {
  const valid = validPackage(draft);
  const groups = scheduleGroups(draft);
  const target = valid ? draft.bouquetsPerPeriod * draft.comboCount : 0;
  const outside = draft.deliveryDates.filter((date) => !groups.some((g) => g.key === periodKey(date, draft.period)));
  const complete = valid && draft.deliveryDates.length === target && groups.length > 0 && groups.every((g) => g.dates.length === g.required) && !outside.length;
  const matched = historical ? receiptPrice : recommendations.find((r) => r.enabled && r.period === draft.period && r.bouquetsPerPeriod === draft.bouquetsPerPeriod);
  return <aside className="ht-summary ht-calendar-summary">
    <span className="eyebrow">NHỊP HOA CỦA BẠN</span>
    <h3>{valid ? `${draft.bouquetsPerPeriod} bó/${draft.period === "week" ? "tuần" : "tháng"} × ${draft.comboCount} combo` : "Chọn gói phù hợp"}</h3>
    {valid ? <p className="ht-helper">Nhận trong {draft.comboCount} {draft.period === "week" ? "tuần" : "tháng"} liên tiếp, mỗi ngày 1 bó.</p> : null}
    <p className={`ht-progress-total ${complete ? "is-complete" : ""}`} aria-live={historical ? undefined : "polite"} aria-atomic="true">{complete ? <Check size={20} aria-hidden="true" /> : <CalendarDays size={20} aria-hidden="true" />}{complete ? `Đã chọn đủ ${target} ngày nhận` : `Đã chọn ${draft.deliveryDates.length}/${target} ngày`}</p>
    {!draft.startPeriod ? <p className="ht-helper">Chọn ngày đầu tiên để xác định thời gian bắt đầu combo.</p> : null}
    <div className="ht-period-groups">{groups.map((g) => <section className="ht-period-progress" key={g.key}>
      <div><strong>{g.label}</strong><span className={`ht-quota ${g.dates.length === g.required ? "is-complete" : g.dates.length > g.required ? "is-over" : ""}`}>{g.dates.length}/{g.required} · {g.dates.length === g.required ? "Đủ" : g.dates.length > g.required ? "Vượt" : "Thiếu"}</span></div>
      {g.dates.length ? <ul>{g.dates.map((date) => <li key={date}><span>{fullDate(date)}</span>{remove ? <button type="button" aria-label={`Bỏ ngày ${date}`} onClick={() => remove(date)}><X size={14} aria-hidden="true" /></button> : null}</li>)}</ul> : <p className="ht-helper">Cần chọn {g.required} ngày trong chu kỳ này.</p>}
    </section>)}</div>
    {outside.length ? <div className="ht-outside-dates"><strong>Ngày cần bỏ để phù hợp gói mới</strong><ul>{outside.map((date) => <li key={date}>{fullDate(date)}{remove ? <button type="button" className="text-link" onClick={() => remove(date)}>Bỏ ngày {date}</button> : null}</li>)}</ul></div> : null}
    <div className="ht-price">{matched ? <><p>{historical ? "Gợi ý tham khảo lúc tiếp nhận" : "Giá tham khảo"}</p><strong>{recommendationPrice(matched)}</strong><p>Hòe sẽ tư vấn giá cho toàn bộ combo bạn chọn.</p></> : <p>Hòe sẽ tư vấn giá phù hợp</p>}</div>
    <p className="ht-helper">Lịch khách đề xuất — chờ Hòe xác nhận</p>
  </aside>;
}
