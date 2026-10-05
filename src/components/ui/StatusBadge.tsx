import { valueLabel } from "@/domain/labels";
export function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`hoe-badge hoe-badge--${value}`}>
      <span aria-hidden="true" className="hoe-badge-dot" />
      {valueLabel(value)}
    </span>
  );
}
