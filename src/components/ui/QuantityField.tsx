"use client";

import { InputNumber } from "@/components/untitled/base/input/input-number";
export function QuantityField({
  name,
  label = "Số lượng",
  value,
  defaultValue = 1,
  onChange,
}: {
  name?: string;
  label?: string;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
}) {
  return (
    <InputNumber
      name={name}
      label={label}
      size="md"
      orientation="horizontal"
      value={value}
      defaultValue={defaultValue}
      minValue={1}
      maxValue={99}
      step={1}
      formatOptions={{ useGrouping: false, maximumFractionDigits: 0 }}
      validationBehavior="aria"
      onChange={(next) => {
        if (Number.isInteger(next) && next >= 1 && next <= 99) onChange?.(next);
      }}
    />
  );
}
