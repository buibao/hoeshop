"use client";

import { useRef, useState } from "react";
import { useStoreOverlay } from "@/components/StoreScope";
import SelectWithLeadingText from "@/components/shadcn-space/select/select-08";

type Props = {
  id: string;
  name: string;
  label: string;
  defaultValue?: string | number;
  required?: boolean;
  options: { value: string; label: string }[];
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

export function StoreSelect({ id, name, label, defaultValue, required, options, ...aria }: Props) {
  const [open, setOpen] = useState(false);
  useStoreOverlay(open);
  const initialValue = options.some(option => option.value === String(defaultValue))
    ? String(defaultValue)
    : options[0]?.value ?? "";
  const [value, setValue] = useState(initialValue);
  const hidden = useRef<HTMLInputElement>(null);
  return <>
    <SelectWithLeadingText id={id} aria-label={label} {...aria} leadingText={name === "shape" ? "Kiểu hoa:" : "Dịch vụ:"} options={options} value={value} required={required} open={open} onOpenChange={setOpen} onValueChange={next => {
      setValue(next);
      if (hidden.current) {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(hidden.current, next);
        hidden.current.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }} />
    <input ref={hidden} type="text" hidden readOnly aria-hidden="true" tabIndex={-1} name={name} value={value} data-focus-target={id} />
  </>;
}
