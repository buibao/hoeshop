"use client";

import { useId, useRef } from "react";
import { Input } from "@/components/untitled/base/input/input";
import { TextArea } from "@/components/untitled/base/textarea/textarea";
import { Button } from "@/components/untitled/base/buttons/button";
import { SelectField, notifyForm } from "./ui/SelectField";
import { DateTimeField } from "./ui/DateTimeField";
type FieldProps = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  defaultValue?: string | number;
  multiline?: boolean;
  hint?: string;
  maxLength?: number;
  min?: string | number;
  max?: string | number;
  autoComplete?: string;
  full?: boolean;
  options?: { value: string; label: string }[];
  errors?: Record<string, string>;
  presets?: string[];
};
export function Field({
  name,
  label,
  type = "text",
  required,
  disabled,
  readOnly,
  defaultValue,
  multiline,
  hint,
  maxLength,
  autoComplete,
  full,
  options,
  errors,
  presets,
}: FieldProps) {
  const id = useId(),
    input = useRef<HTMLInputElement>(null);
  const error = errors?.[name];
  const shared = {
    id,
    name,
    label,
    isRequired: required,
    isDisabled: disabled,
    isReadOnly: readOnly,
    defaultValue: String(defaultValue ?? ""),
    hint: error || hint,
    isInvalid: Boolean(error),
    validationBehavior: "aria" as const,
    size: "md" as const,
  };
  if (type === "date" || type === "time")
    return (
      <DateTimeField
        name={name}
        label={label}
        type={type}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        defaultValue={defaultValue}
        hint={hint}
        errors={errors}
      />
    );
  return (
    <div className={full ? "col-span-full" : undefined} data-field-name={name}>
      {options ? (
        <SelectField
          {...{
            name,
            label,
            defaultValue,
            options,
            required,
            disabled,
            readOnly,
            hint,
            error,
          }}
        />
      ) : multiline ? (
        <TextArea {...shared} maxLength={maxLength || 1500} />
      ) : (
        <Input
          {...shared}
          ref={input}
          type={type as "text"}
          maxLength={maxLength || 500}
          autoComplete={autoComplete}
        />
      )}
      {presets?.length ? (
        <div
          className="mt-3 flex flex-wrap gap-3"
          aria-label={`Gợi ý ${label.toLowerCase()}`}
        >
          {presets.map((preset) => (
            <Button
              key={preset}
              size="sm"
              color="secondary"
              onPress={() => {
                if (!input.current) return;
                Object.getOwnPropertyDescriptor(
                  HTMLInputElement.prototype,
                  "value",
                )?.set?.call(input.current, preset);
                input.current.dispatchEvent(
                  new Event("input", { bubbles: true }),
                );
                notifyForm(input.current);
                input.current.focus();
              }}
            >
              {preset}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
export function Honeypot() {
  return (
    <div hidden aria-hidden="true">
      <label>
        Để trống trường này
        <input name="honeypot" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
export function focusError(form: HTMLFormElement, path: string) {
  const named =
    form.elements.namedItem(path) ||
    form.elements.namedItem(path.split(".").at(-1)!);
  const wrapper = Array.from(
    form.querySelectorAll<HTMLElement>("[data-field-name]"),
  ).find((node) => node.dataset.fieldName === path);
  const control =
    wrapper?.querySelector<HTMLElement>(
      'input:not([type="hidden"]),textarea,button,[role="spinbutton"]',
    ) || named;
  if (control instanceof HTMLElement) {
    let parent = control.parentElement;
    while (parent && parent !== form) {
      if (parent instanceof HTMLDetailsElement) parent.open = true;
      parent = parent.parentElement;
    }
    control.focus();
  }
}
