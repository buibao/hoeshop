"use client";
import { useId, useRef } from "react";
import { DateTimeField } from "./ui/DateTimeField";
type FieldProps = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
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
  defaultValue,
  multiline,
  hint,
  maxLength,
  min,
  max,
  autoComplete,
  full,
  options,
  errors,
  presets,
}: FieldProps) {
  const id = useId(),
    input = useRef<HTMLInputElement>(null);
  const error = errors?.[name];
  const hintId = id + "-hint";
  const errorId = id + "-error";
  if (type === "date" || type === "time")
    return (
      <DateTimeField
        name={name}
        label={label}
        type={type}
        required={required}
        defaultValue={defaultValue}
        hint={hint}
        errors={errors}
      />
    );
  const props = {
    id,
    name,
    defaultValue,
    required,
    "aria-invalid": !!error,
    "aria-describedby":
      [hint ? hintId : "", error ? errorId : ""].filter(Boolean).join(" ") ||
      undefined,
  };
  return (
    <div className={`field ${full ? "full" : ""}`}>
      <label htmlFor={id}>
        {label}
        {required ? (
          <span className="required-mark" aria-hidden="true" />
        ) : null}
      </label>
      {options ? (
        <select {...props}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : multiline ? (
        <textarea {...props} maxLength={maxLength || 1500} />
      ) : (
        <input
          ref={input}
          {...props}
          type={type}
          maxLength={maxLength || 500}
          min={min}
          max={max}
          autoComplete={autoComplete}
        />
      )}
      {presets?.length ? (
        <div
          className="hoe-presets"
          aria-label={`Gợi ý ${label.toLowerCase()}`}
        >
          {presets.map((preset) => (
            <button
              type="button"
              key={preset}
              onClick={() => {
                if (!input.current) return;
                Object.getOwnPropertyDescriptor(
                  HTMLInputElement.prototype,
                  "value",
                )?.set?.call(input.current, preset);
                input.current.dispatchEvent(
                  new Event("input", { bubbles: true }),
                );
                input.current.focus();
              }}
            >
              {preset}
            </button>
          ))}
        </div>
      ) : null}
      {hint ? (
        <span id={hintId} className="field-hint">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className="required small">
          {error}
        </span>
      ) : null}
    </div>
  );
}
export function Honeypot() {
  return (
    <div className="honeypot" aria-hidden="true">
      <label>
        Để trống trường này
        <input name="honeypot" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
export function focusError(form: HTMLFormElement, path: string) {
  let field =
    form.elements.namedItem(path) ||
    form.elements.namedItem(path.split(".").at(-1)!);
  if (path.includes("recurrence")) {
    if (/recurrence\.(deliveryDates|startPeriod)/.test(path)) {
      const calendar = form.querySelector<HTMLElement>("[data-delivery-calendar]");
      calendar?.focus();
      return;
    }
    const name = path.replace(/^configuration\./, "").replace(/\.\d+$/, "");
    field = form.elements.namedItem(name) || field;
    if (field instanceof RadioNodeList) field = Array.from(field).find((node) => node instanceof HTMLInputElement && !node.disabled) as HTMLInputElement || null;
    if (!(field instanceof HTMLElement) || field instanceof HTMLInputElement && field.type === "hidden") {
      const root = form.querySelector<HTMLElement>("[data-recurrence-root]");
      (root?.querySelector<HTMLElement>('input:not([type="hidden"]):not(:disabled)') || root)?.focus();
      return;
    }
  }
  if (field instanceof HTMLElement) {
    let parent = field.parentElement;
    while (parent && parent !== form) {
      if (parent instanceof HTMLDetailsElement) parent.open = true;
      parent = parent.parentElement;
    }
  }
  if (
    field instanceof HTMLInputElement &&
    field.type === "hidden" &&
    field.dataset.focusTarget
  )
    document.getElementById(field.dataset.focusTarget)?.focus();
  else if (field instanceof HTMLElement) field.focus();
}
