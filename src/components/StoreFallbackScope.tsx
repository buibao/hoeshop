"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { StoreScope } from "./StoreScope";

/** Root 404s bypass ShopLayout. Keep internal/auth fallbacks outside Store. */
export function StoreFallbackScope({ className, children }: { className: string; children: ReactNode }) {
  const pathname = usePathname();
  const outsideStore = /^\/(?:admin|dang-nhap|xem-thu)(?:\/|$)/.test(pathname ?? "");
  return outsideStore ? children : <StoreScope className={className}>{children}</StoreScope>;
}
