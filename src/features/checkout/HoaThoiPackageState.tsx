"use client";

import { createContext, useState } from "react";
import { getSmoothScrollController } from "@/components/ui/SmoothScroll";
import { storedRecurrenceSchema, type Recommendation } from "@/domain/recurrence";
import { isCalendarRecurrence, type SchedulePeriod } from "@/domain/delivery-schedule";

type Draft = { bouquets: string; combos: string; startPeriod: string; deliveryDates: string[] };

export function useHoaThoiPackageState(initial?: unknown) {
  const parsed = storedRecurrenceSchema.safeParse(initial);
  const saved = parsed.success ? parsed.data : undefined;
  const calendarSaved = isCalendarRecurrence(saved) ? saved : undefined;
  const savedN = saved ? isCalendarRecurrence(saved) ? saved.bouquetsPerPeriod : "timesPerPeriod" in saved ? saved.timesPerPeriod : saved.period === "week" ? saved.weekdays.length : saved.weeks.reduce((n, w) => n + w.weekdays.length, 0) : 1;
  const savedC = saved ? isCalendarRecurrence(saved) ? saved.comboCount : "durationWeeks" in saved ? saved.durationWeeks : "durationMonths" in saved ? saved.durationMonths : 1 : 1;
  const makeDraft = (p: SchedulePeriod): Draft => ({ bouquets: String(saved?.period === p ? savedN : 1), combos: String(saved?.period === p ? savedC : 1), startPeriod: calendarSaved?.period === p ? calendarSaved.startPeriod : "", deliveryDates: calendarSaved?.period === p ? calendarSaved.deliveryDates : [] });
  const [period, setPeriod] = useState<SchedulePeriod>(saved?.period || "week");
  const [weekly, setWeekly] = useState(() => makeDraft("week"));
  const [monthly, setMonthly] = useState(() => makeDraft("month"));
  const [referenceId, setReferenceId] = useState("");
  const [locked, setLocked] = useState(false);

  function update(change: (draft: Draft) => Draft, p = period) {
    if (p === "week") setWeekly(change); else setMonthly(change);
  }
  function choose(r: Recommendation) {
    setReferenceId(r.id);
    setPeriod(r.period);
    update((v) => ({ ...v, bouquets: String(r.bouquetsPerPeriod) }), r.period);
  }
  function reset() {
    setPeriod("week");
    setWeekly({ bouquets: "1", combos: "1", startPeriod: "", deliveryDates: [] });
    setMonthly({ bouquets: "1", combos: "1", startPeriod: "", deliveryDates: [] });
    setReferenceId("");
    setLocked(false);
  }
  return { period, setPeriod, weekly, monthly, referenceId, setReferenceId, locked, setLocked, update, choose, reset };
}

export const HoaThoiPackageContext = createContext<ReturnType<typeof useHoaThoiPackageState> | null>(null);

export function scrollToPackageControls(node: HTMLElement | null) {
  if (!node) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scroll = getSmoothScrollController();
  if (scroll) scroll.scrollTo(node, { offset: -110, immediate: reduced });
  else node.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "start" });
}
