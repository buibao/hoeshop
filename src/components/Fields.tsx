"use client";
import { useId } from "react";
type FieldProps = { name: string; label: string; type?: string; required?: boolean; defaultValue?: string | number; multiline?: boolean; hint?: string; maxLength?: number; min?: string | number; max?: string | number; autoComplete?: string; full?: boolean; options?: { value: string; label: string }[]; errors?: Record<string,string> };
export function Field({ name, label, type = "text", required, defaultValue, multiline, hint, maxLength, min, max, autoComplete, full, options, errors }: FieldProps) {
  const id = useId(); const error = errors?.[name]; const hintId = id + "-hint"; const errorId = id + "-error";
  const props = { id, name, defaultValue, required, "aria-invalid": !!error, "aria-describedby": [hint ? hintId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined };
  return <div className={`field ${full ? "full" : ""}`}><label htmlFor={id}>{label}{required ? <span className="required-mark" aria-hidden="true"/> : null}</label>
    {options ? <select {...props}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>
      : multiline ? <textarea {...props} maxLength={maxLength || 1500} /> : <input {...props} type={type} maxLength={maxLength || 500} min={min} max={max} autoComplete={autoComplete} />}
    {hint ? <span id={hintId} className="field-hint">{hint}</span> : null}
    {error ? <span id={errorId} className="required small">{error}</span> : null}
  </div>;
}
export function Honeypot() {
  return <div className="honeypot" aria-hidden="true"><label>Để trống trường này<input name="honeypot" tabIndex={-1} autoComplete="off"/></label></div>;
}
export function focusError(form: HTMLFormElement, path: string) {
  const field = form.elements.namedItem(path) || form.elements.namedItem(path.split(".").at(-1)!);
  if (field instanceof HTMLElement) field.focus();
}
