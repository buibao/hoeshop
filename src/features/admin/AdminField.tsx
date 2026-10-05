"use client";

import { Input } from "@/components/untitled/base/input/input";
import { InputNumber } from "@/components/untitled/base/input/input-number";
import { TextArea } from "@/components/untitled/base/textarea/textarea";
import { SelectField } from "@/components/ui/SelectField";
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
  const shared = {
    name: path,
    id: path,
    label,
    hint: errors[path] || hint,
    isInvalid: Boolean(errors[path]),
    isReadOnly: readOnly,
    validationBehavior: "aria" as const,
    size: "md" as const,
  };
  return (
    <div data-field-name={path}>
      {type === "select" ? (
        <SelectField
          name={path}
          label={label}
          value={String(value ?? "")}
          options={(options || []).map((v) => ({
            value: v,
            label: v ? valueLabel(v) : "Chưa chọn",
          }))}
          onChange={(next) => change(path, next)}
          error={errors[path]}
          hint={hint}
          readOnly={readOnly}
        />
      ) : type === "textarea" ? (
        <TextArea
          {...shared}
          value={String(value ?? "")}
          rows={rows}
          onChange={(next) => change(path, next)}
        />
      ) : type === "number" ? (
        <InputNumber
          {...shared}
          value={Number(value ?? 0)}
          minValue={0}
          formatOptions={{ useGrouping: false, maximumFractionDigits: 0 }}
          onChange={(next) => change(path, next)}
        />
      ) : (
        <Input
          {...shared}
          value={String(value ?? "")}
          onChange={(next) => change(path, next)}
        />
      )}
    </div>
  );
}
