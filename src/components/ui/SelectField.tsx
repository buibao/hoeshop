"use client";

import { useId, useRef, useState, useEffect } from "react";
import { Select } from "@/components/untitled/base/select/select";
export function notifyForm(element: HTMLElement | null) {
  element
    ?.closest("form")
    ?.dispatchEvent(new Event("change", { bubbles: true }));
}
export function SelectField({
  name,
  label,
  defaultValue = "",
  value,
  onChange,
  options,
  error,
  hint,
  required,
  disabled,
  readOnly,
}: {
  name: string;
  label: string;
  defaultValue?: string | number;
  value?: string;
  onChange?: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  const id = useId(),
    input = useRef<HTMLInputElement>(null);
  const [local, setLocal] = useState(String(defaultValue));
  const selected = value ?? local;
  const choices = options.map((option) => ({
    ...option,
    id: option.value || "__hoe_empty__",
  }));
  useEffect(() => {
    const form = input.current?.form;
    const reset = () => {
      if (value === undefined) {
        setLocal(String(defaultValue));
        onChange?.(String(defaultValue));
      }
    };
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [defaultValue, onChange, value]);
  return (
    <div data-field-name={name}>
      <Select
        id={id}
        label={label}
        size="md"
        value={selected || "__hoe_empty__"}
        items={choices}
        placeholder={
          options.find((option) => !option.value)?.label || "Chưa chọn"
        }
        isRequired={required}
        isDisabled={disabled || readOnly}
        isInvalid={Boolean(error)}
        hint={error || hint}
        validationBehavior="aria"
        onChange={(key) => {
          const next = key === "__hoe_empty__" ? "" : String(key ?? "");
          setLocal(next);
          if (input.current) input.current.value = next;
          onChange?.(next);
          notifyForm(input.current);
        }}
      >
        {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
      </Select>
      <input
        ref={input}
        type="hidden"
        name={name}
        value={selected}
        disabled={disabled}
        data-focus-target={id}
        readOnly
      />
    </div>
  );
}
