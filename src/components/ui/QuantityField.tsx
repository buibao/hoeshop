"use client";
import { useId, useState } from "react";
import { Minus, Plus } from "lucide-react";
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
  const id = useId(),
    [draft, setDraft] = useState(String(defaultValue));
  const current = value ?? Number(draft);
  function update(next: number) {
    if (!Number.isInteger(next) || next < 1 || next > 99) return;
    setDraft(String(next));
    onChange?.(next);
  }
  return (
    <div className="field hoe-widget">
      <label htmlFor={id}>{label}</label>
      <div className="hoe-quantity">
        <button
          type="button"
          aria-label="Giảm số lượng"
          disabled={current <= 1}
          onClick={() => update(current - 1)}
        >
          <Minus size={16} />
        </button>
        <input
          id={id}
          name={name}
          className="quantity"
          type="number"
          inputMode="numeric"
          min={1}
          max={99}
          value={value ?? draft}
          onChange={(e) => {
            if (value === undefined) setDraft(e.target.value);
            else update(Number(e.target.value));
          }}
          onBlur={() => {
            if (
              !Number.isInteger(Number(draft)) ||
              Number(draft) < 1 ||
              Number(draft) > 99
            )
              update(defaultValue);
          }}
        />
        <button
          type="button"
          aria-label="Tăng số lượng"
          disabled={current >= 99}
          onClick={() => update(current + 1)}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
