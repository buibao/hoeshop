"use client";
import { useContext, useEffect, useId, useRef, useState } from "react";
import { CalendarDays, Flower2, Minus, Plus } from "lucide-react";
import { HoaThoiRecommendations } from "@/components/HoaThoiRecommendations";
import { storedRecurrenceSchema, periodLabel, type Recommendation } from "@/domain/recurrence";
import { calendarRecurrenceSchema, isCalendarRecurrence, periodKey, selectionBlock, vietnamToday, MAX_WEEK_COMBOS, MAX_MONTH_COMBOS, type ScheduleDraft } from "@/domain/delivery-schedule";
import { HoaThoiDeliveryCalendar } from "./HoaThoiDeliveryCalendar";
import { HoaThoiScheduleProgress } from "./HoaThoiScheduleProgress";
import { HoaThoiPackageContext, scrollToPackageControls, useHoaThoiPackageState } from "./HoaThoiPackageState";

function NumberField({ label, name, value, max, change, id, helper, error, unit }: { label: string; name: string; value: string; max: number; change: (value: string) => void; id: string; helper: string; error?: string; unit: string }) {
  const [touched, setTouched] = useState(false);
  const valid = value !== "" && Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= max;
  const feedback = error || (touched && !valid ? `Nhập số nguyên từ 1 đến ${max}.` : "");
  return <div className="ht-number-field">
    <label htmlFor={id}>{label} <span className="ht-helper">(bắt buộc)</span></label>
    <div className="ht-number-stepper"><button type="button" aria-label={`Giảm ${label.toLowerCase()}`} disabled={!valid || Number(value) <= 1} onClick={() => change(String(Number(value) - 1))}><Minus size={16} /></button>
      <input id={id} name={name} type="number" inputMode="numeric" min={1} max={max} step={1} value={value} onChange={(e) => change(e.target.value)} onBlur={() => setTouched(true)} aria-invalid={!!feedback} aria-describedby={`${id}-hint${feedback ? ` ${id}-error` : ""}`} />
      <span>{unit}</span><button type="button" aria-label={`Tăng ${label.toLowerCase()}`} disabled={!valid || Number(value) >= max} onClick={() => change(String(Number(value) + 1))}><Plus size={16} /></button></div>
    <p className="ht-helper" id={`${id}-hint`}>{helper}</p>{feedback ? <p className="ht-error" id={`${id}-error`}>{feedback}</p> : null}
  </div>;
}
export function RecurrenceFields({ initial, recommendations = [], showRecommendations = false, errors = {} }: { initial?: unknown; recommendations?: Recommendation[]; showRecommendations?: boolean; errors?: Record<string, string> }) {
  const parsed = storedRecurrenceSchema.safeParse(initial);
  const saved = parsed.success ? parsed.data : undefined;
  const calendarSaved = isCalendarRecurrence(saved) ? saved : undefined;
  const id = useId(), controls = useRef<HTMLDivElement>(null);
  const localPackage = useHoaThoiPackageState(initial);
  const sharedPackage = useContext(HoaThoiPackageContext);
  const packageState = sharedPackage ?? localPackage;
  const { period, setPeriod, weekly, monthly, referenceId, setReferenceId, update } = packageState;
  const [today, setToday] = useState(() => vietnamToday());
  useEffect(() => {
    const tick = () => setToday(vietnamToday());
    const timer = window.setInterval(tick, 30000);
    window.addEventListener("focus", tick);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", tick); };
  }, []);
  const active = period === "week" ? weekly : monthly;
  const draft: ScheduleDraft = { period, bouquetsPerPeriod: active.bouquets === "" ? NaN : Number(active.bouquets), comboCount: active.combos === "" ? NaN : Number(active.combos), startPeriod: active.startPeriod, deliveryDates: active.deliveryDates };
  const candidate = { version: 5, ...draft };
  const normalized = calendarRecurrenceSchema.safeParse(candidate);
  const localError = (name: string) => errors[name] || errors[`configuration.${name}`];
  function toggle(date?: string) {
    if (!date) { update((v) => ({ ...v, deliveryDates: [], startPeriod: "" })); return; }
    if (selectionBlock(draft, date, today)) return;
    update((v) => {
      const dates = v.deliveryDates.includes(date) ? v.deliveryDates.filter((d) => d !== date) : [...v.deliveryDates, date].sort();
      return { ...v, deliveryDates: dates, startPeriod: dates.length ? v.startPeriod || periodKey(date, period) : "" };
    });
  }
  function choose(r: Recommendation) {
    packageState.choose(r);
    requestAnimationFrame(() => scrollToPackageControls(controls.current));
  }
  return <div className="ht-fields full">
    {showRecommendations ? <HoaThoiRecommendations recommendations={recommendations} referenceId={referenceId} period={period} bouquets={draft.bouquetsPerPeriod} choose={choose} id={id} /> : null}
    <div className="ht-form-heading"><span className="eyebrow">BẠN CHỌN NGÀY, HÒE GỬI HOA</span><h2>Chọn gói và lịch nhận hoa</h2><p>Chọn nhịp phù hợp và những ngày bạn muốn hoa ghé đến. Hòe sẽ cùng bạn chốt từng điều nhỏ.</p>{showRecommendations ? <a href="#mau-hoa" className="text-link">Xem mẫu hoa tham khảo</a> : null}</div>
    <div className="ht-package-controls" ref={controls} data-recurrence-root tabIndex={-1}>
      <input type="hidden" name="recurrence" value={JSON.stringify(normalized.success ? normalized.data : candidate)} />
      <span className="eyebrow">01 / CHỌN NHỊP HOA</span>
      <fieldset className="ht-package-group"><legend>Bạn muốn nhận hoa theo gói nào?</legend><div className="ht-period-options">{(["week", "month"] as const).map((p) => <label className={`ht-period-option ${period === p ? "is-selected" : ""}`} key={p}>
        <input type="radio" name="recurrence.period" value={p} checked={period === p} onChange={() => { setPeriod(p); setReferenceId(""); }} /><span><strong>{p === "week" ? <Flower2 size={20} /> : <CalendarDays size={20} />} Gói {p === "week" ? "Tuần" : "Tháng"}</strong><small>{p === "week" ? "Hoa ghé mỗi tuần" : "Một nhịp hoa theo tháng"}</small></span>
      </label>)}</div></fieldset>
      <div className="ht-count-controls">
        <NumberField id={`${id}-bouquets`} name="recurrence.bouquetsPerPeriod" label={`Số bó mỗi ${periodLabel(period)}`} unit="bó" value={active.bouquets} max={period === "week" ? 7 : 31} change={(bouquets) => update((v) => ({ ...v, bouquets }))} helper="Mỗi ngày nhận 1 bó. Bạn sẽ chọn ngày riêng cho từng chu kỳ." error={localError("recurrence.bouquetsPerPeriod")} />
        <NumberField id={`${id}-combos`} name="recurrence.comboCount" label="Số combo" unit="combo" value={active.combos} max={period === "week" ? MAX_WEEK_COMBOS : MAX_MONTH_COMBOS} change={(combos) => update((v) => ({ ...v, combos }))} helper={`Tương ứng ${active.combos || "…"} ${periodLabel(period)} liên tiếp.`} error={localError("recurrence.comboCount")} />
      </div>
      {!calendarSaved && saved ? <p className="ht-helper">Cấu hình theo phiên bản cũ. Vui lòng chọn các ngày nhận cụ thể để lưu lại gói.</p> : null}
      {localError("recurrence") ? <p className="ht-error">{localError("recurrence")}</p> : null}
    </div>
    <div className="ht-layout"><div className="ht-schedule ht-calendar-panel"><HoaThoiDeliveryCalendar key={period} draft={draft} today={today} change={toggle} errors={errors} /></div><HoaThoiScheduleProgress draft={draft} recommendations={recommendations} remove={toggle} /></div>
  </div>;
}
