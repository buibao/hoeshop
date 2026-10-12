"use client";

import { useId, useRef, useState, type Ref } from "react";
import { X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStoreOverlay } from "@/components/StoreScope";
import { useStoreValueFeedback } from "@/components/ui/StoreMotion";

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
// Keep exact stored minutes while retaining the supplied widget's hour/minute UI.
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
const PERIODS = ["AM", "PM"] as const;

function Digit({ value, wide = false }: { value: string; wide?: boolean }) {
  const digit = useRef<HTMLSpanElement>(null);
  useStoreValueFeedback(digit, value);
  return (
    <span className={`relative inline-flex h-5 ${wide ? "w-7" : "w-5"} items-center justify-center overflow-hidden`}>
      <span ref={digit} className="absolute">{value}</span>
    </span>
  );
}

type Props = {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  onClear: () => void;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  hourRef?: Ref<HTMLButtonElement>;
};

// Main input from the supplied Select 10 code; form values remain in 24-hour time.
export default function SelectTimePicker({ id, label, value, onValueChange, onClear, disabled, invalid, describedBy, hourRef }: Props) {
  const minuteId = useId();
  const periodId = useId();
  const [openPart, setOpenPart] = useState<string | null>(null);
  useStoreOverlay(openPart !== null);

  const hasValue = /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  const h24 = hasValue ? Number(value.slice(0, 2)) : 9;
  const hour = String(h24 % 12 || 12).padStart(2, "0");
  const minute = hasValue ? value.slice(3, 5) : "00";
  const period = h24 >= 12 ? "PM" : "AM";

  function update(next: { hour?: string; minute?: string; period?: (typeof PERIODS)[number] }) {
    const nextHour = Number(next.hour ?? hour) % 12 + ((next.period ?? period) === "PM" ? 12 : 0);
    onValueChange(`${String(nextHour).padStart(2, "0")}:${next.minute ?? minute}`);
  }

  const triggerClass = "w-auto gap-1 rounded-full border-none bg-transparent dark:bg-transparent dark:hover:bg-transparent px-1 py-0 shadow-none focus-visible:ring-0 [&_svg]:size-3";
  const segments = [
    { key: "hour", id, label: "Giờ", value: hour, display: hasValue ? hour : "--", options: HOURS },
    { key: "minute", id: minuteId, label: "Phút", value: minute, display: hasValue ? minute : "--", options: MINUTES },
    { key: "period", id: periodId, label: "Buổi", value: period, display: period, options: PERIODS },
  ];

  return (
    <div className="shadcn-space-control flex h-11 w-full items-center justify-center gap-1 rounded-lg border border-border px-2" data-component="select-10" data-invalid={invalid || undefined}>
      {segments.map((segment, index) => (
        <span key={segment.key} className="inline-flex min-w-0 items-center gap-1">
          {index === 1 ? <span className="text-muted-foreground" aria-hidden="true">:</span> : null}
          {/* Keep document scrolling intact so the calendar's sticky summary stays in place. */}
          <Select modal={false} value={hasValue ? segment.value : null} disabled={disabled} open={openPart === segment.key} onOpenChange={open => setOpenPart(open ? segment.key : null)} onValueChange={next => {
            if (next === null) return;
            if (segment.key === "hour") update({ hour: next });
            else if (segment.key === "minute") update({ minute: next });
            else update({ period: next as (typeof PERIODS)[number] });
          }}>
            <SelectTrigger ref={index === 0 ? hourRef : undefined} id={segment.id} size="sm" className={triggerClass} aria-label={`${label} — ${segment.label}`} aria-invalid={invalid} aria-describedby={describedBy}>
              <SelectValue><Digit value={segment.display} wide={index === 2} /></SelectValue>
            </SelectTrigger>
            <SelectContent className="min-w-16" align="center" alignItemWithTrigger={false}>
              {segment.options.map(option => <SelectItem key={option} value={option} className="justify-center pr-1.5 text-center">{option}</SelectItem>)}
            </SelectContent>
          </Select>
        </span>
      ))}
      {hasValue ? <button type="button" className="time-clear" aria-label={`Xóa giờ: ${label}`} disabled={disabled} onClick={onClear}><X size={14} aria-hidden="true" /></button> : null}
    </div>
  );
}
