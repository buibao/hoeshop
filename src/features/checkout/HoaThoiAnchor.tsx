"use client";

import type { MouseEvent, ReactNode } from "react";
import { getSmoothScrollController } from "@/components/ui/SmoothScroll";

export function HoaThoiAnchor({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const node = document.getElementById(href.slice(1));
    if (!node) return;
    event.preventDefault();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scroll = getSmoothScrollController();
    if (scroll) scroll.scrollTo(node, { offset: -110, duration: 0.3, immediate: reduced });
    else node.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "start" });
    node.focus({ preventScroll: true });
    if (location.hash !== href) history.pushState(null, "", href);
  }
  return <a href={href} className={className} onClick={navigate}>{children}</a>;
}
