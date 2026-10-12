"use client";

import { useId, useRef, useState } from "react";
import SelectTimePicker from "@/components/shadcn-space/select/select-10";

type Props = {
  name: string;
  label: string;
  defaultValue?: string | number;
  hint?: string;
  errors?: Record<string, string>;
  required?: boolean;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
};

export function StoreTimeField({ name, label, defaultValue = "", errors, required, disabled, onValueChange }: Props) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const hourTrigger = useRef<HTMLButtonElement>(null);
  const [value, setValue] = useState(String(defaultValue));
  const valid = /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  const error = errors?.[name] || (value && !valid ? "Chọn giờ hợp lệ." : "");
  const describedBy = error ? `${id}-error` : undefined;

  function commit(next: string) {
    setValue(next);
    if (input.current) {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input.current, next);
      input.current.dispatchEvent(new Event("input", { bubbles: true }));
    }
    onValueChange?.(next);
  }

  return <div className="field date-time-field">
    <label htmlFor={id}>{label}{required ? <span className="required-mark" aria-hidden="true" /> : null}</label>
    <SelectTimePicker id={id} label={label} value={value} onValueChange={commit} onClear={() => { commit(""); hourTrigger.current?.focus(); }} disabled={disabled} invalid={!!error} describedBy={describedBy} hourRef={hourTrigger} />
    <input ref={input} type="text" hidden readOnly tabIndex={-1} aria-hidden="true" name={name} value={value} disabled={disabled} data-focus-target={id} />
    {error ? <span id={`${id}-error`} className="required small" role="alert">{error}</span> : null}
  </div>;
}
