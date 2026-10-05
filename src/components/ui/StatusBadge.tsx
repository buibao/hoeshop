import { BadgeWithDot } from "@/components/untitled/base/badges/badges";
import { valueLabel } from "@/domain/labels";
export function StatusBadge({ value }: { value: string }) {
  const color = ["completed", "resolved", "published", "visible"].includes(
    value,
  )
    ? "success"
    : ["hidden", "cancelled"].includes(value)
      ? "error"
      : value === "confirmed"
        ? "warning"
        : ["received", "contacted"].includes(value)
          ? "brand"
          : "gray";
  return (
    <BadgeWithDot type="pill-color" size="sm" color={color}>
      {valueLabel(value)}
    </BadgeWithDot>
  );
}
