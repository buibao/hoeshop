"use client";
import { createContext, useContext, useEffect, useId, useRef, useState } from "react";
import { DayPicker, DayButton, Week, Month, CaptionLabel, type DayButtonProps, type WeekProps, type MonthProps, type CaptionLabelProps } from "@daypicker/react";
import { vi } from "@daypicker/react/locale";
import { Check, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { fullDate, nextMonth, periodKey, scheduleFeasibility, scheduleGroups, selectionBlock, shortDate, validPackage, type ScheduleDraft } from "@/domain/delivery-schedule";
import { useHoaThoiFeedback } from "./HoaThoiMotion";

const CalendarProgressContext = createContext<{ period: ScheduleDraft["period"]; groups: ReturnType<typeof scheduleGroups> }>({ period: "week", groups: [] });

function CalendarCaption(props: CaptionLabelProps) {
  // Month navigation and selection share the concise live region below.
  return <CaptionLabel {...props} role={undefined} aria-live="off" />;
}

function CycleProgress({ group }: { group?: ReturnType<typeof scheduleGroups>[number] }) {
  const count = useRef<HTMLSpanElement>(null);
  useHoaThoiFeedback(count, `${group?.key}:${group?.dates.length}/${group?.required}`);
  return <div className="ht-calendar-cycle" aria-hidden={group ? undefined : true}>
    {group ? <><span>{group.label}</span><span ref={count} className={group.dates.length === group.required ? "is-complete" : ""}><Check className="ht-cycle-check" size={12} aria-hidden="true" />{group.dates.length}/{group.required} ngày</span></> : <span>&nbsp;</span>}
  </div>;
}

function CalendarWeek(props: WeekProps) {
  const { period, groups } = useContext(CalendarProgressContext);
  // A boundary week uses the same domain group in either visible month.
  const key = periodKey(isoDate(props.week.days[0].date), "week");
  const group = groups.find((g) => g.key === key);
  return <><Week {...props} />{period === "week" ? <tr className="ht-calendar-progress-row"><td colSpan={7}><CycleProgress group={group} /></td></tr> : null}</>;
}

function CalendarMonth({ children, ...props }: MonthProps) {
  const { period, groups } = useContext(CalendarProgressContext);
  const key = isoDate(props.calendarMonth.date).slice(0, 7);
  return <Month {...props}>{children}{period === "month" ? <CycleProgress group={groups.find((g) => g.key === key)} /> : null}</Month>;
}

function localDate(iso: string) { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d || 1, 12); }
function isoDate(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function CalendarDayButton({ children, modifiers, ...props }: DayButtonProps) {
  return <DayButton modifiers={modifiers} {...props}><span>{children}</span><Check className="ht-day-check" size={12} aria-hidden="true" /></DayButton>;
}
export function HoaThoiDeliveryCalendar({ draft, today, change, errors }: { draft: ScheduleDraft; today: string; change: (date?: string) => void; errors?: Record<string, string> }) {
  const id = useId(), root = useRef<HTMLDivElement>(null);
  const [month, setMonth] = useState(() => localDate(draft.deliveryDates[0]?.slice(0, 7) || today.slice(0, 7)));
  const [wide, setWide] = useState(false);
  const total = useRef<HTMLParagraphElement>(null);
  useHoaThoiFeedback(total, `${draft.deliveryDates.length}/${draft.bouquetsPerPeriod * draft.comboCount}`);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWide(entry.contentRect.width >= 650));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const groups = scheduleGroups(draft);
  const firstError = Object.entries(errors || {}).find(([key]) => /recurrence\.(deliveryDates|startPeriod)/.test(key))?.[1];
  const disabledPackage = !validPackage(draft);
  const currentMonth = isoDate(month).slice(0, 7);
  const visibleFirst = `${currentMonth}-01` < today ? today : `${currentMonth}-01`;
  const unavailable = !draft.startPeriod && !disabledPackage ? scheduleFeasibility({ ...draft, startPeriod: periodKey(visibleFirst, draft.period) }, today) : "";
  function navigate(amount: number) {
    setMonth(localDate(nextMonth(currentMonth, amount)));
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.current?.querySelector(".ht-calendar-months")?.animate?.([{ opacity: 0.75 }, { opacity: 1 }], { duration: 160, easing: "ease-out" });
    }
  }
  const target = disabledPackage ? 0 : draft.bouquetsPerPeriod * draft.comboCount;
  return <div className="ht-delivery-calendar" ref={root} tabIndex={-1} data-delivery-calendar data-visible-month={currentMonth} aria-labelledby={`${id}-title`} aria-describedby={`${id}-hint ${id}-error`} onFocus={(event) => {
    if (event.target !== event.currentTarget) return;
    const missing = groups.find((g) => g.dates.length !== g.required);
    if (missing) setMonth(localDate(missing.start < today ? today : missing.start));
  }}>
    <div className="ht-calendar-heading"><div><span className="eyebrow">02 / NGÀY HOA GHÉ</span><h3 id={`${id}-title`}>Chọn những ngày nhận hoa</h3></div><div className="ht-calendar-controls"><button type="button" aria-label="Tháng trước" disabled={currentMonth <= today.slice(0, 7)} onClick={() => navigate(-1)}><ChevronLeft size={18} aria-hidden="true" /></button><button type="button" aria-label="Tháng sau" onClick={() => navigate(1)}><ChevronRight size={18} aria-hidden="true" /></button></div></div>
    <p className="ht-helper" id={`${id}-hint`}>{disabledPackage ? "Nhập số bó và số combo hợp lệ để chọn ngày." : "Mỗi ngày nhận 1 bó. Chọn đủ ngày trong từng chu kỳ; bấm lại ngày đã chọn để bỏ."}</p>
    <p className="ht-calendar-total" ref={total} aria-live="polite" aria-atomic="true"><span>Đã chọn {draft.deliveryDates.length}/{target} ngày</span><span className="ht-helper">Số ngày cần chọn: {target}</span><span className="visually-hidden">Lịch tháng {month.getMonth() + 1}, năm {month.getFullYear()}{wide ? " và tháng kế tiếp" : ""}.</span></p>
    <CalendarProgressContext.Provider value={{ period: draft.period, groups }}>
    <DayPicker mode="multiple" locale={vi} weekStartsOn={1} month={month} numberOfMonths={wide ? 2 : 1} onMonthChange={setMonth} hideNavigation showOutsideDays={false} fixedWeeks
      startMonth={localDate(today.slice(0, 7))} today={localDate(today)} selected={draft.deliveryDates.map(localDate)}
      onSelect={() => {}} onDayClick={(date) => { const iso = isoDate(date); if (!selectionBlock(draft, iso, today, groups)) change(iso); }}
      hidden={{ before: localDate(today) }} disabled={(date) => !!selectionBlock(draft, isoDate(date), today, groups)}
      modifiers={{ region: (date) => groups.some((g) => isoDate(date) >= g.start && isoDate(date) <= g.end) }} modifiersClassNames={{ region: "ht-calendar-region" }}
      components={{ DayButton: CalendarDayButton, Week: CalendarWeek, Month: CalendarMonth, CaptionLabel: CalendarCaption }} className="ht-date-picker"
      classNames={{ months: "ht-calendar-months", month: "ht-calendar-month", month_caption: "ht-calendar-caption", month_grid: "ht-calendar-grid", weekdays: "ht-calendar-weekdays", weekday: "ht-calendar-weekday", day: "ht-calendar-day", day_button: "ht-calendar-day-button", selected: "ht-calendar-selected", today: "ht-calendar-today", disabled: "ht-calendar-disabled", hidden: "ht-calendar-hidden" }}
      labels={{ labelGrid: (date) => `Lịch tháng ${date.getMonth() + 1}, năm ${date.getFullYear()}`, labelDayButton: (date, modifiers) => `${fullDate(isoDate(date))} · ${isoDate(date)}${modifiers.today ? ", hôm nay" : ""}${modifiers.selected ? ", đã chọn" : ""}${modifiers.disabled ? ", không thể chọn" : ""}` }} />
    </CalendarProgressContext.Provider>
    {unavailable ? <p className="ht-error">{unavailable}</p> : null}
    <div className="ht-calendar-key"><span><i className="ht-key-region" aria-hidden="true" />Chu kỳ đang chọn</span><span><Check size={14} aria-hidden="true" />Ngày đã chọn</span><span><i className="ht-key-unavailable" aria-hidden="true" />Không thể chọn</span><span>Hôm nay: {shortDate(today)}</span></div>
    <p className="ht-helper">Ngày ngoài vùng combo hoặc chu kỳ đã đủ số ngày sẽ không chọn thêm được. Dùng phím mũi tên để di chuyển, Enter/Space để chọn.</p>
    {groups.length ? <p className="ht-helper">Phạm vi: {shortDate(groups[0].start)}–{shortDate(groups.at(-1)!.end)}.</p> : null}
    <button type="button" className="ht-reset-calendar" onClick={() => { change(); setMonth(localDate(today)); }} disabled={!draft.deliveryDates.length}><RotateCcw size={15} />Chọn lại thời gian nhận</button>
    <p className="ht-helper">Thao tác này sẽ xóa các ngày đang chọn và giữ nguyên gói cùng thông tin liên hệ.</p>
    {draft.deliveryDates.some((d) => d < today) ? <p className="ht-error">Có ngày nhận đã ở quá khứ; hãy bỏ ngày cũ trong tóm tắt để chọn lại.</p> : null}
    <p className="ht-error" id={`${id}-error`} role={firstError ? "alert" : undefined}>{firstError}</p>
  </div>;
}
