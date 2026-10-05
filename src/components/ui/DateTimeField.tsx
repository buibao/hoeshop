"use client";

import { useId, useRef, useState, useEffect } from "react";
import { parseDate, parseTime, type DateValue } from "@internationalized/date";
import { TimeField } from "react-aria-components";
import {
  InputDate,
  InputDateBase,
} from "@/components/untitled/base/input/input-date";
import { Label } from "@/components/untitled/base/input/label";
import { HintText } from "@/components/untitled/base/input/hint-text";
import { Button } from "@/components/untitled/base/buttons/button";
import { DatePicker } from "@/components/untitled/application/date-picker/date-picker";
import { vietnamToday } from "@/domain/schemas";
import { notifyForm } from "./SelectField";
type Props = {
  name: string;
  label: string;
  type: "date" | "time";
  defaultValue?: string | number;
  hint?: string;
  errors?: Record<string, string>;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
};
function dateValue(value: string) {
  try {
    return value ? parseDate(value) : null;
  } catch {
    return null;
  }
}
function timeValue(value: string) {
  try {
    return value ? parseTime(value) : null;
  } catch {
    return null;
  }
}
export function DateTimeField({
  name,
  label,
  type,
  defaultValue = "",
  hint,
  errors,
  required,
  disabled,
  readOnly,
}: Props) {
  const id = useId(),
    hidden = useRef<HTMLInputElement>(null),
    root = useRef<HTMLDivElement>(null);
  const committed = useRef(String(defaultValue));
  const [value, setValue] = useState(String(defaultValue)),
    [draft, setDraft] = useState<DateValue | null>(() =>
      dateValue(String(defaultValue)),
    );
  const [partial, setPartial] = useState(false);
  const feedback = partial
    ? "Vui lòng nhập đủ các phần của ngày/giờ hoặc xóa lựa chọn."
    : errors?.[name];
  useEffect(() => {
    const form = hidden.current?.form,
      node = root.current;
    const reset = () => {
      committed.current = String(defaultValue);
      setValue(String(defaultValue));
      setDraft(dateValue(String(defaultValue)));
      setPartial(false);
    };
    const invalid = () => setPartial(true);
    form?.addEventListener("reset", reset);
    node?.addEventListener("hoe:partial", invalid);
    return () => {
      form?.removeEventListener("reset", reset);
      node?.removeEventListener("hoe:partial", invalid);
    };
  }, [defaultValue]);
  function commit(next: string) {
    committed.current = next;
    setValue(next);
    setPartial(false);
    if (hidden.current) hidden.current.value = next;
    notifyForm(hidden.current);
  }
  const shared = {
    id,
    label,
    size: "md" as const,
    isRequired: required,
    isDisabled: disabled,
    isReadOnly: readOnly,
    isInvalid: Boolean(feedback),
    hint: feedback || hint,
    validationBehavior: "aria" as const,
  };
  return (
    <div
      ref={root}
      data-segment-field
      data-field-name={name}
      className="flex flex-col gap-3"
    >
      {type === "date" ? (
        <>
          <InputDate
            {...shared}
            value={dateValue(value)}
            onChange={(next) => commit(next?.toString() || "")}
            shouldForceLeadingZeros
            granularity="day"
          />
          <div className="flex flex-wrap gap-3">
            <DatePicker
              aria-label={`Mở lịch ${label.toLowerCase()}`}
              size="md"
              value={draft}
              minValue={parseDate(vietnamToday())}
              isDisabled={disabled || readOnly}
              onOpenChange={() => setDraft(dateValue(committed.current))}
              onChange={setDraft}
              onApply={() => commit(draft?.toString() || "")}
              onCancel={() => setDraft(dateValue(committed.current))}
            />
            <Button
              size="md"
              color="tertiary"
              isDisabled={disabled || readOnly || !value}
              onPress={() => {
                commit("");
                setDraft(null);
              }}
            >
              Xóa ngày
            </Button>
          </div>
        </>
      ) : (
        <TimeField
          id={id}
          value={timeValue(value)}
          isRequired={required}
          isDisabled={disabled}
          isReadOnly={readOnly}
          isInvalid={Boolean(feedback)}
          validationBehavior="aria"
          hourCycle={24}
          granularity="minute"
          shouldForceLeadingZeros
          onChange={(next) =>
            commit(
              next
                ? `${String(next.hour).padStart(2, "0")}:${String(next.minute).padStart(2, "0")}`
                : "",
            )
          }
          className="flex h-max w-full flex-col items-start justify-start gap-1.5"
        >
          <Label isRequired={required} isInvalid={Boolean(feedback)}>
            {label}
          </Label>
          <InputDateBase size="md" />
          {feedback || hint ? (
            <HintText isInvalid={Boolean(feedback)}>
              {feedback || hint}
            </HintText>
          ) : null}
        </TimeField>
      )}
      {type === "time" ? (
        <div>
          <Button
            size="md"
            color="tertiary"
            isDisabled={disabled || readOnly || !value}
            onPress={() => commit("")}
          >
            Xóa giờ
          </Button>
        </div>
      ) : null}
      <input
        ref={hidden}
        type="hidden"
        name={name}
        value={value}
        readOnly
        disabled={disabled}
      />
    </div>
  );
}
