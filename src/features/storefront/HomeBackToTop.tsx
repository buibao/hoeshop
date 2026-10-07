"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronUp } from "lucide-react";
import { getSmoothScrollController } from "@/components/ui/SmoothScroll";
import { useReducedMotionPreference } from "@/components/ui/useReducedMotionPreference";

export function HomeBackToTop() {
  const button = useRef<HTMLButtonElement>(null);
  const shown = useRef(false);
  const pending = useRef<(() => void) | null>(null);
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotionPreference();

  const syncVisibility = () => {
    const y = window.scrollY;
    const next = y > 320 || (shown.current && (y >= 240 || document.activeElement === button.current));
    if (next !== shown.current) {
      shown.current = next;
      setVisible(next);
    }
  };

  useEffect(() => {
    const sync = () => syncVisibility();
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("pageshow", sync);
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      pending.current?.();
      window.removeEventListener("scroll", sync);
      window.removeEventListener("pageshow", sync);
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  const goToTop = (keyboard: boolean) => {
    const lenis = getSmoothScrollController();
    if (lenis?.isStopped || document.body.hasAttribute("data-rr-ui-modal-open")) return;
    pending.current?.();
    let finished = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let unsubscribe: (() => void) | undefined;
    const cleanup = () => {
      finished = true;
      unsubscribe?.();
      clearTimeout(timeout);
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchstart", cancel);
      window.removeEventListener("keydown", cancelKey);
      window.removeEventListener("scrollend", completeNative);
      pending.current = null;
    };
    const cancel = () => {
      if (finished) return;
      cleanup();
      // Clear the old target before Lenis handles the user's next gesture.
      if (lenis && !lenis.isStopped) lenis.scrollTo(lenis.actualScroll, { immediate: true });
      else if (!lenis) window.scrollTo({ top: window.scrollY, behavior: "instant" });
    };
    const cancelKey = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", "Escape"].includes(event.key)) cancel();
    };
    const complete = () => {
      if (finished) return;
      cleanup();
      if (keyboard || document.activeElement === button.current) {
        document.getElementById("home-title")?.focus({ preventScroll: true });
      }
      syncVisibility();
    };
    const completeNative = () => { if (window.scrollY === 0) complete(); };
    pending.current = cancel;
    if (lenis) unsubscribe = lenis.on("virtual-scroll", cancel);
    else window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("touchstart", cancel, { passive: true });
    window.addEventListener("keydown", cancelKey);

    if (lenis) {
      // Native anchor/history restoration can precede Lenis's scroll event by a frame.
      lenis.scrollTo(lenis.actualScroll, { immediate: true });
      lenis.scrollTo(0, {
        duration: 0.5, easing: (t) => 1 - Math.pow(1 - t, 3),
        immediate: reduced, lock: false, onComplete: complete,
      });
    } else {
      window.addEventListener("scrollend", completeNative);
      window.scrollTo({ top: 0, behavior: reduced ? "instant" : "smooth" });
      if (reduced || window.scrollY === 0) complete();
      else {
        // Older browsers lack scrollend. Check completion without another RAF loop.
        const check = () => {
          if (finished) return;
          if (window.scrollY === 0) complete();
          else timeout = setTimeout(check, 100);
        };
        timeout = setTimeout(check, 100);
      }
    }
  };

  return <button ref={button} type="button" className="olf-back-to-top"
    data-visible={visible} aria-label="Về đầu trang" title="Về đầu trang"
    aria-hidden={!visible} inert={!visible} tabIndex={visible ? 0 : -1}
    onBlur={syncVisibility} onClick={(event) => goToTop(event.detail === 0)}>
    <ChevronUp size={22} aria-hidden="true" />
  </button>;
}
