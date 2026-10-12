import type { ReactNode } from "react";

/** Static, full-width background owner; the existing content measure stays inside. */
export function StoreHeading({
  children,
  containerClassName = "",
}: {
  children: ReactNode;
  containerClassName?: string;
}) {
  return (
    <div className="store-heading-section">
      <div className={`container ${containerClassName}`.trim()}>{children}</div>
    </div>
  );
}
