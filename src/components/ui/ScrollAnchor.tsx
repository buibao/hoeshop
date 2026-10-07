"use client";
import type { ReactNode, MouseEvent } from "react";

// Let the existing Lenis window listener scroll once; retain native links without JS.
export function ScrollAnchor({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  function click(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = new URL(href, location.href);
    if (target.pathname !== location.pathname || !target.hash || !document.getElementById(target.hash.slice(1)) || !document.documentElement.classList.contains("lenis")) return;
    event.preventDefault();
    if (location.hash !== target.hash) history.pushState(null, "", target.pathname + target.search + target.hash);
  }
  return <a href={href} className={className} onClick={click}>{children}</a>;
}
