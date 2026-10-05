"use client";
import { valueLabel } from "@/domain/labels";
export type EditorFieldProps = {
  path: string;
  label: string;
  value: unknown;
  change: (path: string, value: unknown) => void;
  errors: Record<string, string>;
  hint?: string;
  type?: "text" | "number" | "textarea" | "select";
  options?: readonly string[];
  readOnly?: boolean;
  rows?: number;
};
export function AdminField({
  path,
  label,
  value,
  change,
  errors,
  hint,
  type = "text",
  options,
  readOnly,
  rows = 4,
}: EditorFieldProps) {
  const error = errors[path],
    props = {
      id: path,
      name: path,
      "aria-invalid": error ? (true as const) : undefined,
      "aria-describedby":
        [hint ? `${path}-hint` : "", error ? `${path}-error` : ""]
          .filter(Boolean)
          .join(" ") || undefined,
      value: String(value ?? ""),
      readOnly,
      onChange: (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
      ) =>
        change(
          path,
          type === "number" ? Number(e.target.value) : e.target.value,
        ),
    };
  return (
    <div className="field admin-control">
      <label htmlFor={path}>{label}</label>
      {type === "select" ? (
        <select {...props}>
          {(options || []).map((v) => (
            <option key={v} value={v}>
              {v ? valueLabel(v) : "Chưa chọn"}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea {...props} rows={rows} />
      ) : (
        <input {...props} type={type} min={type === "number" ? 0 : undefined} />
      )}
      {hint && (
        <small id={`${path}-hint`} className="admin-hint">
          {hint}
        </small>
      )}
      {error && (
        <small id={`${path}-error`} className="admin-field-error">
          {error}
        </small>
      )}
    </div>
  );
}
